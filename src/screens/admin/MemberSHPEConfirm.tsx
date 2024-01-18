import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { db, functions } from '../../config/firebaseConfig'
import { getMembersToVerify } from '../../api/firebaseUtils'
import { Timestamp, deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { handleLinkPress } from '../../helpers/links'
import { formatExpirationDate } from '../../helpers/membership';
import { PublicUserInfo } from '../../types/User'
import { AdminDashboardParams } from '../../types/Navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'

const MemberSHPEConfirm = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [selectedMemberDocuments, setSelectedMemberDocuments] = useState<memberSHPEResponse | null>(null);

    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [expirationModalVisible, setExpirationModalVisible] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [loading, setLoading] = useState(true);


    const fetchMembers = async () => {
        setLoading(true);
        try {
            const fetchedMembers = await getMembersToVerify();
            setMembers(fetchedMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMemberDocuments = async (userId: string) => {
        const memberDocRef = doc(db, 'memberSHPE', userId);
        const memberDocSnap = await getDoc(memberDocRef);

        if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data() as memberSHPEResponse;
            setSelectedMemberDocuments(memberData);
        } else {
            console.log('No such document!');
        }
    };

    useEffect(() => {
        if (selectedMemberUID && members) {
            const memberData = members.find(member => member.uid === selectedMemberUID);
            if (memberData) {
                setSelectedMember(memberData);
            } else {
                console.log('No data found for member with UID:', selectedMemberUID);
            }
            fetchMemberDocuments(selectedMemberUID)
        }
    }, [selectedMemberUID, members]);

    // Logic for expiration modal closing is more complicated then simply setting visibility to false
    // so this is needed to deal with dismissible modal
    useEffect(() => {
        if (!initialLoad && !expirationModalVisible) {
            setConfirmVisible(true);
        }
    }, [expirationModalVisible])

    const handleApprove = async () => {
        const userDocRef = doc(db, 'users', selectedMemberUID!);
        await updateDoc(userDocRef, {
            chapterExpiration: selectedMemberDocuments?.chapterExpiration,
            nationalExpiration: selectedMemberDocuments?.nationalExpiration,
        });

        const memberDocRef = doc(db, 'memberSHPE', selectedMemberUID!);
        await deleteDoc(memberDocRef);
        await fetchMembers();

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
        await sendNotificationToMember({
            uid: selectedMemberUID,
            type: "approved",
        });
    };


    const handleDeny = async () => {
        const userDocRef = doc(db, 'users', selectedMemberUID!);

        await updateDoc(userDocRef, {
            chapterExpiration: deleteField(),
            nationalExpiration: deleteField()
        });

        const memberDocRef = doc(db, 'memberSHPE', selectedMemberUID!);
        await deleteDoc(memberDocRef);

        await fetchMembers();

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
        await sendNotificationToMember({
            uid: selectedMemberUID,
            type: "denied",
        });
    };

    return (
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold text-black">MemberSHPE</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && (
                <ActivityIndicator size="large" className='mt-8' />
            )}
            {(members && members.length === 0 && !loading) && (
                <View className='items-center justify-center'>
                    <View className='flex justify-center mt-4'>
                        <Text className='text-xl font-semibold'>No members to verify</Text>
                    </View>
                </View>
            )}

            {members && members.length > 0 && (
                <View className='mt-9 flex-1'>
                    <Text className='ml-6 text-xl font-semibold mb-5'>Select a user</Text>
                    <MembersList
                        handleCardPress={(uid) => {
                            setSelectedMemberUID(uid)
                            setConfirmVisible(true)
                            setInitialLoad(false)
                        }}
                        users={members}
                    />
                </View>
            )}


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
                    <View className='flex-row justify-between'>
                        <TouchableOpacity
                            className='flex-row py-3 rounded-lg justify-center bg-maroon w-[47%] space-x-2'
                            onPress={async () => { handleLinkPress(selectedMemberDocuments?.chapterURL!) }}
                        >
                            <Octicons name="link" size={24} color="white" />
                            <Text className="text-white text-lg">TAMU Chapter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='flex-row py-3 rounded-lg justify-center bg-dark-navy w-[47%] space-x-2'
                            onPress={async () => { handleLinkPress(selectedMemberDocuments?.nationalURL!) }}
                        >
                            <Octicons name="link" size={24} color="white" />
                            <Text className="text-white text-lg">SHPE National</Text>
                        </TouchableOpacity>
                    </View>

                    <View className='flex-row justify-between mt-4'>
                        <View className='flex-col'>
                            <Text className='text-lg font-semibold'>Expires</Text>
                            <Text className='text-lg font-semibold'>{formatExpirationDate(selectedMemberDocuments?.chapterExpiration?.toDate())}</Text>
                        </View>
                        <View className='flex-col'>
                            <Text className='text-lg font-semibold text-right'>Expires</Text>
                            <Text className='text-lg font-semibold text-right'>{formatExpirationDate(selectedMemberDocuments?.nationalExpiration.toDate())}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setConfirmVisible(false);
                                    setExpirationModalVisible(true);
                                }}
                            >
                                <Text className='text-right text-xl text-pale-blue underline'>Adjust</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='flex-col mt-12'>
                        <TouchableOpacity
                            onPress={() => {
                                handleApprove()
                                setConfirmVisible(false);
                            }}
                            className='bg-[#AEF359] w-1/3 items-center py-2 rounded-lg'
                        >
                            <Text className='text-lg font-semibold'>Approve</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                handleDeny()
                                setConfirmVisible(false);
                            }}
                            className='w-1/3 items-center py-2 rounded-lg mt-1'
                        >
                            <Text className='text-lg font-semibold'>Deny</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>

            <DismissibleModal
                visible={expirationModalVisible}
                setVisible={setExpirationModalVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Text className='text-2xl font-semibold ml-2'>Adjust Expiration Date</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => {
                                setExpirationModalVisible(false);
                            }}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text className='text-lg font-semibold '>To be implemented</Text>
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
                    <View className='w-[85%]'>
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
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>
    )
}


interface memberSHPEResponse {
    chapterURL: string;
    nationalURL: string;
    chapterExpiration: Timestamp;
    nationalExpiration: Timestamp;
}

export default MemberSHPEConfirm