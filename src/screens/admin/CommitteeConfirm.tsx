import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DismissibleModal from '../../components/DismissibleModal';
import { Committee, getLogoComponent, reverseFormattedFirebaseName } from '../../types/committees';
import { useFocusEffect } from '@react-navigation/core';
import { collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { db, functions } from '../../config/firebaseConfig';
import { PublicUserInfo } from '../../types/user';
import MembersList from '../../components/MembersList';
import MemberCard from '../../components/MemberCard';
import { httpsCallable } from 'firebase/functions';
import { calculateHexLuminosity } from '../../helpers';

const CommitteeConfirm = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCommittee, setSelectedCommittee] = useState<string | undefined>();
    const [committeeRequests, setCommitteeRequests] = useState<Record<string, PublicUserInfo[]>>({});
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [committeeListVisible, setCommitteeListVisible] = useState(false);
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [initialLoad, setInitialLoad] = useState(true);


    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            const fetchCommittees = async () => {
                try {
                    const committeeCollectionRef = collection(db, 'committees');
                    const q = query(committeeCollectionRef, where("isOpen", "==", false));
                    const snapshot = await getDocs(q);
                    const committees = snapshot.docs.map(doc => ({
                        firebaseDocName: doc.id,
                        ...doc.data() as Committee
                    }))
                    setCommittees(committees);
                } catch (err) {
                    console.error("Error fetching open committees:", err);
                    return [];
                }
            };

            fetchCommittees();

            return () => { };
        }, [])
    );

    useEffect(() => {
        const fetchCommitteesRequests = async () => {
            setLoading(true);
            const committeeRequests: { [key: string]: PublicUserInfo[] } = {};

            for (const committee of committees) {
                const committeeDocName = committee.firebaseDocName;
                if (!committeeDocName) continue;

                try {
                    const committeeRequestsSnapshot = await getDocs(collection(db, `committeeVerification/${committeeDocName}/requests`));
                    const usersInfo: PublicUserInfo[] = [];

                    for (const document of committeeRequestsSnapshot.docs) {
                        const userDocRef = doc(db, 'users', document.id);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            usersInfo.push({ uid: document.id, ...userDocSnap.data() as PublicUserInfo });
                        }
                    }

                    committeeRequests[committeeDocName] = usersInfo;
                } catch (error) {
                    console.error(`Error fetching requests for committee ${committeeDocName}:`, error);
                    committeeRequests[committeeDocName] = [];
                }
            }

            setCommitteeRequests(committeeRequests);
            setLoading(false);
        };
        fetchCommitteesRequests();
    }, [committees])


    useEffect(() => {
        console.log(selectedCommittee)
        if (selectedCommittee) {
            const committeeMembers = committeeRequests![selectedCommittee] || [];
            setMembers(committeeMembers);
        } else {
            setMembers([]);
        }
    }, [selectedCommittee, committeeRequests]);

    const [forceUpdate, setForceUpdate] = useState(0);
    useEffect(() => {
        if (selectedMemberUID && members) {
            const memberData = members.find(member => member.uid === selectedMemberUID);
            if (memberData) {
                setSelectedMember(memberData);
            }
        }
        setForceUpdate(prev => prev + 1);
    }, [selectedMemberUID, members]);

    const handleApprove = async (uid: string) => {
        if (!selectedCommittee) return;
        const userDocRef = doc(db, 'users', uid);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (userDoc.exists()) {
                const currentCommittees = userDoc.data().committees || [];
                if (!currentCommittees.includes(selectedCommittee)) {
                    const updatedCommittees = [...currentCommittees, selectedCommittee];
                    transaction.update(userDocRef, { committees: updatedCommittees });
                }
            }

            const requestDocRef = doc(db, `committeeVerification/${selectedCommittee}/requests`, uid);
            transaction.delete(requestDocRef);
        });

        setMembers(members.filter(member => member.uid !== uid));

        setCommitteeRequests(prevRequests => {
            const updatedRequests = { ...prevRequests };
            if (updatedRequests[selectedCommittee]) {
                updatedRequests[selectedCommittee] = updatedRequests[selectedCommittee].filter(member => member.uid !== uid);
            }
            return updatedRequests;
        });


        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationCommitteeRequest');
        await sendNotificationToMember({
            uid: uid,
            type: "approved",
            committeeName: reverseFormattedFirebaseName(selectedCommittee),
        });
    };

    const handleDeny = async (uid: string) => {
        if (!selectedCommittee) return;
        const requestDocRef = doc(db, `committeeVerification/${selectedCommittee}/requests`, uid);

        try {
            await deleteDoc(requestDocRef);

            setMembers(members.filter(member => member.uid !== uid));

            const sendNotificationToMember = httpsCallable(functions, 'sendNotificationCommitteeRequest');
            await sendNotificationToMember({
                uid: uid,
                type: "denied",
                committeeName: reverseFormattedFirebaseName(selectedCommittee),
            });
        } catch (error) {
            console.error(`Error denying request for user ${uid} in committee ${selectedCommittee}:`, error);
        }
    };

    useEffect(() => {
        if (!initialLoad && !confirmVisible) {
            setCommitteeListVisible(true);
        }
    }, [confirmVisible])


    return (
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold text-black">Committee Membership</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className='pt-8'>
                {loading && (
                    <ActivityIndicator size="large" />
                )}
                {!loading && committees.map((committee) => {
                    const { name, color, firebaseDocName } = committee;
                    const { LogoComponent, height, width } = getLogoComponent(committee.logo);

                    const requestCount = committeeRequests[firebaseDocName!]?.length ?? 0;


                    const isTextLight = (colorHex: string) => {
                        const luminosity = calculateHexLuminosity(colorHex);
                        return luminosity < 155;
                    };

                    return (
                        <View className='flex items-center mb-8 w-full' key={firebaseDocName}>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedCommittee(firebaseDocName)
                                    setCommitteeListVisible(true)
                                    setInitialLoad(false)
                                }}
                                className='flex-row w-[90%] h-28 rounded-xl'
                                style={{ backgroundColor: color }}
                            >
                                <View className='flex-1 rounded-l-xl' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                    <View className='items-center justify-center h-full'>
                                        <LogoComponent width={height} height={width} />
                                    </View>
                                </View>

                                <View className='w-[70%] justify-end py-3 px-5'>
                                    <View className='justify-end flex-row'>
                                        <Text className={`font-bold text-2xl text-${isTextLight(color!) ? "white" : "black"}`}>{name}</Text>
                                    </View>
                                    <View className='justify-end flex-row'>
                                        <Text className={`font-semibold text-${isTextLight(color!) ? "white" : "black"}`}>{requestCount} Request</Text>
                                    </View>
                                </View>

                            </TouchableOpacity>

                        </View>
                    );
                })}
            </ScrollView>

            <DismissibleModal
                visible={committeeListVisible}
                setVisible={setCommitteeListVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md space-y-6 h-screen w-screen'>
                    <View
                        className='flex-row items-center justify-between mx-5 mt-6'
                        style={{ paddingTop: insets.top }}
                    >
                        <View className='flex-row items-center'>
                            <Octicons name="stack" size={35} color="black" />
                            <Text className='text-3xl font-semibold ml-4'>{reverseFormattedFirebaseName(selectedCommittee || "")}</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => {
                                setSelectedCommittee(undefined);
                                setCommitteeListVisible(false);
                            }}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='mt-9 flex-1'>
                        <MembersList
                            key={forceUpdate} // Force rerender when selectedCommittee Changes because rendering problems
                            handleCardPress={(uid) => {
                                setCommitteeListVisible(false);
                                setConfirmVisible(true);
                                setSelectedMemberUID(uid);
                            }}
                            users={members}
                        />
                    </View>

                </View>
            </DismissibleModal>

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-end'>
                        <View>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <MemberCard userData={selectedMember} handleCardPress={() => { }} />
                    <View className='flex-col mt-12'>
                        <TouchableOpacity
                            onPress={() => {
                                handleApprove(selectedMemberUID!)
                                setConfirmVisible(false);
                                setSelectedMemberUID(undefined);
                            }}
                            className='bg-[#AEF359] w-1/3 items-center py-2 rounded-lg'
                        >
                            <Text className='text-lg font-semibold'>Approve</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                handleDeny(selectedMemberUID!)
                                setConfirmVisible(false);
                                setSelectedMemberUID(undefined);
                            }}
                            className='w-1/3 items-center py-2 rounded-lg mt-1'
                        >
                            <Text className='text-lg font-semibold'>Deny</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color="black" />
                            <Text className='text-2xl font-semibold ml-2'>Instructions</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Members that upload both their TAMU Chapter and SHPE national receipt will appear here</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>To begin verification, click on a member and view their TAMU Chapter and SHPE National Proofs</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>
                            You may adjust SHPE National Expiration Date by clicking <Text className='text-pale-blue'>Adjust</Text>. You may enter the day of registration and expiration date will be set OR enter the expiration date directly. Click Save. </Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>
                            Click Approve or Deny and the member will be notified.</Text>
                    </View> */}
                </View>
            </DismissibleModal>


        </SafeAreaView>
    )
}

export default CommitteeConfirm