import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert, TouchableHighlight, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, functions } from '../../config/firebaseConfig'
import { getMembersToVerify } from '../../api/firebaseUtils'
import { Timestamp, deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { handleLinkPress } from '../../helpers/links'
import { formatExpirationDate } from '../../helpers/membership';
import { PublicUserInfo } from '../../types/user'
import { HomeStackParams } from '../../types/navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'
import { UserContext } from '../../context/UserContext';
import { formatDate } from '../../helpers/timeUtils';

const MemberSHPEConfirm = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [selectedMemberDocuments, setSelectedMemberDocuments] = useState<memberSHPEResponse | null>(null);
    const [overrideNationalExpiration, setOverrideNationalExpiration] = useState<Timestamp>();

    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [expirationModalVisible, setExpirationModalVisible] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [loading, setLoading] = useState(true);
    const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);

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
        fetchMembers();
    }, []);


    useEffect(() => {
        if (selectedMemberUID && members) {
            const memberData = members.find(member => member.uid === selectedMemberUID);
            if (memberData) {
                setSelectedMember(memberData);
            }
            fetchMemberDocuments(selectedMemberUID)
        }
    }, [selectedMemberUID, members]);

    // Logic for expiration modal closing is more complicated then simply setting visibility to false
    // so this is needed to deal with dismissible modal
    useEffect(() => {
        if (!initialLoad && !expirationModalVisible) {
            setConfirmVisible(true);
            setOverrideNationalExpiration(undefined);
        }
    }, [expirationModalVisible])

    const handleApprove = async (uid: string) => {
        const userDocRef = doc(db, 'users', uid);

        await updateDoc(userDocRef, {
            chapterExpiration: selectedMemberDocuments?.chapterExpiration,
            nationalExpiration: selectedMemberDocuments?.nationalExpiration,
        });


        const memberDocRef = doc(db, 'memberSHPE', uid);
        await deleteDoc(memberDocRef);

        setMembers(members.filter(member => member.uid !== uid));

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
        await sendNotificationToMember({
            uid: uid,
            type: "approved",
        });
    };

    const handleDeny = async (uid: string) => {
        const userDocRef = doc(db, 'users', uid);

        await updateDoc(userDocRef, {
            chapterExpiration: deleteField(),
            nationalExpiration: deleteField()
        });

        const memberDocRef = doc(db, 'memberSHPE', uid);
        await deleteDoc(memberDocRef);

        setMembers(members.filter(member => member.uid !== uid));

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
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
                    <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>MemberSHPE</Text>
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
                        <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>No members to verify</Text>
                    </View>
                </View>
            )}

            {members && members.length > 0 && (
                <View className='mt-9 flex-1'>
                    <Text className={`ml-6 text-xl font-semibold mb-5 ${darkMode ? "text-white" : "text-black"}`}>Select a user</Text>
                    <MembersList
                        key={members.length}
                        handleCardPress={(uid) => {
                            setSelectedMemberUID(uid)
                            setConfirmVisible(true)
                            setInitialLoad(false)
                        }}
                        users={members}
                        canSearch={false}
                    />
                </View>
            )}

            {loading && (
                <ActivityIndicator size="small" className='mt-8' />
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

                    <MemberCard userData={selectedMember} handleCardPress={() => { }} />

                    <View>
                        <TouchableOpacity
                            className='flex-row py-3 rounded-lg justify-center items-center bg-maroon'
                            onPress={async () => { handleLinkPress(selectedMemberDocuments?.chapterURL!) }}
                        >
                            <View className='absolute left-0 ml-3'>
                                <Octicons name="link" size={24} color="white" />
                            </View>
                            <Text className="text-white text-lg font-bold">TAMU Chapter</Text>
                        </TouchableOpacity>

                        <View className='items-center'>
                            <Text className={` text-lg font-semibold mt-2 ${darkMode ? "text-white" : "text-black"}`}>Expires {formatExpirationDate(selectedMemberDocuments?.chapterExpiration)}</Text>
                        </View>

                        <TouchableOpacity
                            className='flex-row py-3 rounded-lg justify-center items-center bg-dark-navy mt-10'
                            onPress={async () => { handleLinkPress(selectedMemberDocuments?.nationalURL!) }}
                        >
                            <View className='absolute left-0 ml-3'>
                                <Octicons name="link" size={24} color="white" />
                            </View>
                            <Text className="text-white text-lg font-bold">SHPE National</Text>
                        </TouchableOpacity>

                        <View className='items-center'>
                            <Text className={` text-lg font-semibold mt-2 ${darkMode ? "text-white" : "text-black"}`}>Expires {formatExpirationDate(selectedMemberDocuments?.nationalExpiration)}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setConfirmVisible(false);
                                    setExpirationModalVisible(true);
                                }}
                            >
                                <Text className='text-xl font-semibold text-primary-blue underline'>Adjust Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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
                visible={expirationModalVisible}
                setVisible={setExpirationModalVisible}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 space-y-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ minWidth: 325, minHeight: 250 }}
                >
                    <View className='flex-row items-center justify-end'>
                        <TouchableOpacity onPress={() => setExpirationModalVisible(false)}>
                            <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    <Text className={`text-xl font-semibold text-center ${darkMode ? "text-white" : "text-black"}`}>Adjust National Expiration Date</Text>

                    <View className='flex-row items-center justify-center mt-10 mb-16'>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>Expiration Date:</Text>
                        {(Platform.OS == 'android' && selectedMemberDocuments?.nationalExpiration) &&
                            <TouchableHighlight
                                underlayColor={darkMode ? "" : "#EEE"}
                                onPress={() => setShowExpirationDatePicker(true)}
                                className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            >
                                <>
                                    <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{overrideNationalExpiration ? formatDate(overrideNationalExpiration.toDate()) : formatDate(selectedMemberDocuments?.nationalExpiration.toDate()!)}</Text>
                                </>
                            </TouchableHighlight>
                        }
                        {(Platform.OS == 'ios' && selectedMemberDocuments?.nationalExpiration) &&
                            <View className='flex flex-row items-center'>
                                <DateTimePicker
                                    themeVariant={darkMode ? 'dark' : 'light'}
                                    testID='Start Time Picker'
                                    value={overrideNationalExpiration?.toDate() ?? selectedMemberDocuments?.nationalExpiration.toDate() ?? new Date()}
                                    mode='date'
                                    onChange={(_, date) => {
                                        if (!date) {
                                            console.warn("Date picked is undefined.")
                                        }
                                        else {
                                            setOverrideNationalExpiration(Timestamp.fromDate(date));
                                        }
                                    }}
                                />
                            </View>
                        }
                    </View>

                    <View className='flex-row space-x-6'>
                        <TouchableOpacity
                            onPress={() => {
                                setExpirationModalVisible(false);
                                setSelectedMemberDocuments({
                                    ...selectedMemberDocuments!,
                                    nationalExpiration: overrideNationalExpiration ?? selectedMemberDocuments?.nationalExpiration!
                                })
                            }}
                            className='flex-1 bg-primary-blue items-center py-2 rounded-lg justify-center'
                        >
                            <Text className='text-lg font-semibold text-white'>Adjust</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setExpirationModalVisible(false);
                                setOverrideNationalExpiration(undefined);
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
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>Members that upload both their TAMU Chapter and SHPE national receipt will appear here</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>To begin verification, click on a member and view their TAMU Chapter and SHPE National Proofs</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                            You may adjust SHPE National Expiration Date by clicking <Text className='text-primary-blue'>Adjust</Text>. You may enter the day of registration and expiration date will be set OR enter the expiration date directly. Click Save. </Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>Click Approve or Deny and the member will be notified.</Text>
                    </View>
                </View>
            </DismissibleModal>


            {/* Expiration Date Pickers */}
            {(Platform.OS == 'android' && showExpirationDatePicker && selectedMemberDocuments?.nationalExpiration) &&
                <DateTimePicker
                    testID='Start Time Picker'
                    value={selectedMemberDocuments?.nationalExpiration?.toDate() ?? new Date()}
                    mode='date'
                    onChange={(_, date) => {
                        if (!date) {
                            console.warn("Date picked is undefined.")
                        }
                        else {
                            setOverrideNationalExpiration(Timestamp.fromDate(date));
                        }
                        setShowExpirationDatePicker(false);
                    }}
                />
            }
        </SafeAreaView>
    )
}


interface memberSHPEResponse {
    chapterURL: string;
    nationalURL: string;
    chapterExpiration: Timestamp;
    nationalExpiration: Timestamp;
    shirtSize: string;
}

export default MemberSHPEConfirm