import { View, Text, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { db, functions } from '../../config/firebaseConfig'
import { getMembersToResumeVerify } from '../../api/firebaseUtils'
import { deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { handleLinkPress } from '../../helpers/links'
import { PublicUserInfo } from '../../types/user'
import { HomeStackParams } from '../../types/navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'
import { UserContext } from '../../context/UserContext';

const ResumeConfirm = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

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
        <SafeAreaView className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Resume Bank</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
            </View>

            {(members && members.length === 0 && !loading) && (
                <View className='items-center justify-center'>
                    <View className='flex justify-center mt-4'>
                        <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>No resumes to verify</Text>
                    </View>
                </View>
            )}

            {members && members.length > 0 && (
                <View className='mt-9 flex-1'>
                    <Text className={`ml-6 text-xl font-semibold mb-5 ${darkMode ? "text-white" : "text-black"}`}>Select a user</Text>
                    <MembersList
                        handleCardPress={(uid) => {
                            setSelectedMemberUID(uid)
                            setConfirmVisible(true)
                        }}
                        canSearch={false}
                        users={members}
                    />
                </View>
            )}

            {loading && (
                <ActivityIndicator size="large" className='mt-8' />
            )}

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ minWidth: 325 }}
                >
                    <View className='flex-row items-center justify-end'>
                        <View>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <MemberCard userData={selectedMember} />


                    <TouchableOpacity
                        className='flex-row py-3 rounded-lg justify-center items-center bg-dark-navy'
                        onPress={async () => { handleLinkPress(selectedMemberDocuments?.resumePublicURL!) }}
                    >
                        <View className='absolute left-0 ml-3'>
                            <Octicons name="link" size={24} color="white" />
                        </View>
                        <Text className="text-white text-lg font-bold">SHPE National</Text>
                    </TouchableOpacity>

                    <View className='mt-20 flex-row space-x-6'>
                        <TouchableOpacity
                            onPress={() => {
                                handleApprove(selectedMemberUID!)
                                setConfirmVisible(false);
                            }}
                            className='flex-1 bg-primary-blue items-center py-2 rounded-lg justify-center'
                        >
                            <Text className='text-lg font-semibold text-white'>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                handleDeny(selectedMemberUID!)
                                setConfirmVisible(false);
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
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>Members that upload resume will appear here.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>To begin verification, click on a member and view their Resume.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>Keep in mind that this resume bank should only include “high quality” resume.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>For the safety of our members, we advice denying resume that contain private information such as address.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>Click Approve or Deny, the resume will appear on the resume bank, and the member will be notified.</Text>
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