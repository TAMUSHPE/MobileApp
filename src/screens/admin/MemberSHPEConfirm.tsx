import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert, TouchableHighlight } from 'react-native'
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
import { PublicUserInfo } from '../../types/User'
import { AdminDashboardParams } from '../../types/Navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'
import { UserContext } from '../../context/UserContext';
import { formatDate } from '../../helpers/timeUtils';

const MemberSHPEConfirm = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [selectedMemberDocuments, setSelectedMemberDocuments] = useState<memberSHPEResponse | null>(null);
    const [selectedMemberShirtSize, setSelectedMemberShirtSize] = useState<memberSHPEResponse | null>(null);
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

    const fetchMemberShirtSize = async (userId: string) => {
        const shirtDocRef = doc(db, 'shirtSize', userId);
        const shirtDocSnap = await getDoc(shirtDocRef);

        if (shirtDocSnap.exists()) {
            const memberData = shirtDocSnap.data() as memberSHPEResponse;
            setSelectedMemberShirtSize(memberData);
        } else {
            console.log('No Shirt Size!');
        }
    };

    useEffect(() => {
        if (selectedMemberUID && members) {
            const memberData = members.find(member => member.uid === selectedMemberUID);
            if (memberData) {
                setSelectedMember(memberData);
            }
            fetchMemberDocuments(selectedMemberUID)
            fetchMemberShirtSize(selectedMemberUID)
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
                        key={members.length}
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
                            <Text className='text-lg font-semibold'>{formatExpirationDate(selectedMemberDocuments?.chapterExpiration)}</Text>
                            <Text className='text-lg font-semibold'>Shirt Size: {selectedMemberDocuments?.shirtSize}</Text>
                        </View>
                        <View className='flex-col'>
                            <Text className='text-lg font-semibold text-right'>Expires</Text>
                            <Text className='text-lg font-semibold text-right'>{formatExpirationDate(selectedMemberDocuments?.nationalExpiration)}</Text>
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
                visible={expirationModalVisible}
                setVisible={setExpirationModalVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6' style={{ minWidth: 325, minHeight: 250 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Text className='text-2xl font-semibold ml-2'>Adjust National Expiration Date</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => {
                                setExpirationModalVisible(false);
                            }}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <View className='flex-row items-center mt-4'>
                            <Text className='text-lg mr-4'>Expiration Date</Text>
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

                        {(overrideNationalExpiration || selectedMemberDocuments?.nationalExpiration) && (
                            <View className='mt-4 '>
                                <Text className='text-lg text-pale-blue text-center'>Adjusted National Expiration Date</Text>
                                <Text className='text-lg text-pale-blue text-center'>{overrideNationalExpiration ? formatDate(overrideNationalExpiration.toDate()) : formatDate(selectedMemberDocuments?.nationalExpiration.toDate()!)}</Text>
                                <View className='flex-row items-center justify-around mt-5'>
                                    <TouchableOpacity
                                        className='w-1/3 bg-pale-blue justify-center items-center py-2 rounded-md'
                                        onPress={() => {
                                            setExpirationModalVisible(false);
                                            setSelectedMemberDocuments({
                                                ...selectedMemberDocuments!,
                                                nationalExpiration: overrideNationalExpiration ?? selectedMemberDocuments?.nationalExpiration!
                                            })
                                        }}
                                    >
                                        <Text className='text-white text-lg'>Save</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className='w-1/3 bg-pale-blue justify-center items-center py-2 rounded-md'
                                        style={{ backgroundColor: "red" }}
                                        onPress={() => {
                                            setExpirationModalVisible(false);
                                            setOverrideNationalExpiration(undefined);
                                        }}>
                                        <Text className='text-white text-lg'>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}


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