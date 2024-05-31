import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { db, functions } from '../../config/firebaseConfig'
import { getMembersToResumeVerify } from '../../api/firebaseUtils'
import { deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { handleLinkPress } from '../../helpers/links'
import { PublicUserInfo } from '../../types/user'
import { AdminDashboardParams } from '../../types/navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'

const ResumeConfirm = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [selectedMemberDocuments, setSelectedMemberDocuments] = useState<resumeResponse | null>(null);

    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const fetchedMembers = await getMembersToResumeVerify();
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
        const memberDocRef = doc(db, 'resumeVerification', userId);
        const memberDocSnap = await getDoc(memberDocRef);

        if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data() as resumeResponse;
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

    const handleApprove = async (uid: string) => {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
            resumeVerified: true,
        });


        const memberDocRef = doc(db, 'resumeVerification', uid);
        await deleteDoc(memberDocRef);

        setMembers(members.filter(member => member.uid !== uid));

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationResumeConfirm');
        await sendNotificationToMember({
            uid: uid,
            type: "approved",
        });
    };


    const handleDeny = async (uid: string) => {
        const userDocRef = doc(db, 'users', uid);

        await updateDoc(userDocRef, {
            resumePublicURL: deleteField(),
            resumeVerified: false,
        });

        const memberDocRef = doc(db, 'resumeVerification', uid);
        await deleteDoc(memberDocRef);

        setMembers(members.filter(member => member.uid !== uid));

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationResumeConfirm');
        await sendNotificationToMember({
            uid: uid,
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
                    <Text className="text-2xl font-bold text-black">Resume Bank</Text>
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
                        <Text className='text-xl font-semibold'>No Resume to verify</Text>
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

                    <MemberCard userData={selectedMember} />

                    <View className='flex-row justify-between'>
                        <TouchableOpacity
                            className='flex-row justify-center px-6 items-center rounded-lg bg-pale-blue space-x-2 w-[47%] h-10'
                            onPress={async () => { handleLinkPress(selectedMemberDocuments?.resumePublicURL!) }}
                        >
                            <Octicons name="link" size={24} color="white" />
                            <Text className="text-white text-lg">View Resume</Text>
                        </TouchableOpacity>

                        <View className='flex-col w-[47%]'>
                            <TouchableOpacity
                                onPress={() => {
                                    handleApprove(selectedMemberUID!)
                                    setConfirmVisible(false);
                                }}
                                className='bg-[#AEF359] items-center py-2 rounded-lg'
                            >
                                <Text className='text-lg font-semibold'>Approve</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    handleDeny(selectedMemberUID!)
                                    setConfirmVisible(false);
                                }}
                                className='items-center py-2 rounded-lg mt-1'
                            >
                                <Text className='text-lg font-semibold'>Deny</Text>
                            </TouchableOpacity>
                        </View>
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
                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Members that upload resume will appear here.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>To begin verification, click on a member and view their Resume.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Keep in mind that this resume bank should only include “high quality” resume.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>For the safety of our members, we advice denying resume that contain private information such as address.</Text>
                    </View>


                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Click Approve or Deny, the resume will appear on the resume bank, and the member will be notified.</Text>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView >
    )
}


interface resumeResponse {
    resumePublicURL: string;
}

export default ResumeConfirm