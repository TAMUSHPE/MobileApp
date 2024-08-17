import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, useColorScheme, Modal } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
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
import { HomeStackParams } from '../../types/navigation';
import { UserContext } from '../../context/UserContext';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';

const CommitteeConfirm = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const insets = useSafeAreaInsets();

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

    useFocusEffect(
        useCallback(() => {
            const fetchCommittees = async () => {
                try {
                    const committeeCollectionRef = collection(db, 'committees');
                    const q = query(committeeCollectionRef, where("isOpen", "==", false));
                    const snapshot = await getDocs(q);

                    const committees = await Promise.all(snapshot.docs.map(async doc => {
                        const firebaseDocName = doc.id;
                        const requestSnapshot = await getDocs(collection(db, `committeeVerification/${firebaseDocName}/requests`));
                        const requestCount = requestSnapshot.size; // Count the number of requests

                        return {
                            firebaseDocName,
                            requestCount, // Include request count
                            ...doc.data() as Committee
                        };
                    }));

                    // Sort committees by request count in descending order
                    committees.sort((a, b) => b.requestCount - a.requestCount);

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
        <SafeAreaView className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Committee Membership</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className='pt-8'>
                <View className='flex-row flex-wrap mt-10 mx-4 justify-between'>

                    {!loading && committees.map((committee) => {
                        const { name, logo, firebaseDocName } = committee;
                        const { LogoComponent, LightLogoComponent, height, width } = getLogoComponent(logo);

                        const requestCount = committeeRequests[firebaseDocName!]?.length ?? 0;

                        return (
                            <TouchableOpacity
                                key={firebaseDocName}
                                onPress={() => {
                                    setSelectedCommittee(firebaseDocName)
                                    setCommitteeListVisible(true)
                                    setInitialLoad(false)
                                }}
                                className={`w-[45%] flex-col h-40 mb-11 p-2 rounded-xl ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,

                                    elevation: 5,
                                }}
                            >

                                <View className='flex-row justify-center'>
                                    <Text className={`text-lg ${darkMode ? "text-white" : "text-black"} ${requestCount > 0 && "text-primary-blue font-bold"}`}>{requestCount} Request</Text>
                                </View>


                                {/* Logo */}
                                <View className='items-center justify-center flex-1'>
                                    {darkMode ?
                                        <LightLogoComponent height={height * .9} width={width * .9} />
                                        :
                                        <LogoComponent height={height * .9} width={width * .9} />
                                    }
                                </View>

                                {/* Name and Membership */}
                                <View className='items-center justify-center'>
                                    <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(name, 11)}</Text>
                                </View>

                            </TouchableOpacity>
                        );
                    })}
                </View>


                {loading && (
                    <ActivityIndicator size="small" />
                )}
            </ScrollView>


            <Modal
                animationType="slide"
                transparent={true}
                visible={committeeListVisible}
                onRequestClose={() => {
                    setCommitteeListVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className='h-screen'>
                        <View className='flex-row justify-between mx-6'>
                            <View className='flex-row items-center'>
                                <Octicons name="stack" size={35} color={darkMode ? "white" : "black"} />
                                <Text className={`text-3xl font-semibold ml-4 text-black ${darkMode ? "text-white" : "text-black"}`}>{reverseFormattedFirebaseName(selectedCommittee || "")}</Text>
                            </View>
                            <View>
                                <TouchableOpacity onPress={() => {
                                    setSelectedCommittee(undefined);
                                    setCommitteeListVisible(false);
                                }}>
                                    <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className='mt-9 flex-1'>
                            {members && members.length === 0 && (
                                <Text className={`text-lg font-bold text-center ${darkMode ? "text-white" : "text-black"}`}>No members to verify</Text>
                            )}
                            <MembersList
                                key={forceUpdate} // Force rerender when selectedCommittee Changes because rendering problems
                                handleCardPress={(uid) => {
                                    setCommitteeListVisible(false);
                                    setConfirmVisible(true);
                                    setSelectedMemberUID(uid);
                                }}
                                canSearch={false}
                                users={members}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ width: 325 }}
                >
                    <View className='flex-row items-center justify-end'>
                        <View>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <MemberCard userData={selectedMember} handleCardPress={() => { }} />

                    <Text className={`text-md ${darkMode ? "text-white" : "text-black"}`}>
                        {selectedMember?.name} {selectedMember?.committees && selectedMember.committees.length > 0 ? "is also in:" : "is not in any committees"}
                    </Text>

                    {selectedMember?.committees && selectedMember.committees.length > 0 && (
                        <View className='flex-row flex-wrap'>
                            {selectedMember?.committees?.map((committeeName, index) => {
                                return (
                                    <View key={index}>
                                        <Text className={`text-md text-primary-blue`}>
                                            {reverseFormattedFirebaseName(committeeName) || "Unknown"}
                                            {index < selectedMember.committees!.length - 1 && ", "}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}


                    <View className='mt-12 flex-row space-x-6'>
                        <TouchableOpacity
                            onPress={() => {
                                handleApprove(selectedMemberUID!)
                                setConfirmVisible(false);
                                setSelectedMemberUID(undefined);
                            }}
                            className='flex-1 bg-primary-blue items-center py-2 rounded-lg justify-center'
                        >
                            <Text className='text-lg font-semibold text-white'>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                handleDeny(selectedMemberUID!)
                                setConfirmVisible(false);
                                setSelectedMemberUID(undefined);
                            }}
                            className='flex-1 items-center py-2 rounded-lg justify-center'
                        >
                            <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Deny</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 space-y-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ minWidth: 325 }}
                >
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color={darkMode ? "white" : "black"} />
                            <Text className={`text-2xl font-semibold ml-2 ${darkMode ? "text-white" : "text-black"}`}>Instructions</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>All closed committees and their members request will appear here.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>Click on a committee, select a member and approve or deny their membership.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                            The member will be notified when they are approved or denied </Text>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>
    )
}

export default CommitteeConfirm