import { View, Text, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { db } from '../../config/firebaseConfig'
import { getMembersToShirtVerify } from '../../api/firebaseUtils'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { PublicUserInfo } from '../../types/user'
import { HomeStackParams } from '../../types/navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'
import { UserContext } from '../../context/UserContext';

const ShirtConfirm = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [pickedUpMembers, setPickedUpMembers] = useState<PublicUserInfo[]>([]);
    const [notPickedUpMembers, setNotPickedUpMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [selectedMemberDocuments, setSelectedMemberDocuments] = useState<shirtResponse | null>(null);

    const [selectOption, setSelectOption] = useState<string>('notPickedUp');
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [forceUpdate, setForceUpdate] = useState(0);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { pickedUp, notPickedUp } = await getMembersToShirtVerify();
            setPickedUpMembers(pickedUp);
            setNotPickedUpMembers(notPickedUp);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberDocuments = async (userId: string) => {
        const memberDocRef = doc(db, 'shirt-sizes', userId);
        const memberDocSnap = await getDoc(memberDocRef);

        if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data() as shirtResponse;
            setSelectedMemberDocuments(memberData);
        } else {
            console.log('No such document!');
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        if (selectedMemberUID) {
            const combinedMembers = [...pickedUpMembers, ...notPickedUpMembers];
            const memberData = combinedMembers.find(member => member.uid === selectedMemberUID);
            if (memberData) {
                setSelectedMember(memberData);
            } else {
                console.log('No data found for member with UID:', selectedMemberUID);
            }
            fetchMemberDocuments(selectedMemberUID);
        }
    }, [selectedMemberUID, pickedUpMembers, notPickedUpMembers]);

    const handleCheck = async () => {
        if (selectedMemberUID) {
            const userDocRef = doc(db, 'shirt-sizes', selectedMemberUID);
            await updateDoc(userDocRef, {
                shirtPickedUp: true,
            });

            setNotPickedUpMembers(prevMembers =>
                prevMembers.filter(member => member.uid !== selectedMemberUID)
            );
            setPickedUpMembers(prevMembers =>
                [...prevMembers, { ...selectedMember, shirtPickedUp: true } as PublicUserInfo]
            );

            setForceUpdate(forceUpdate + 1);
        }
    };

    const handleUncheck = async () => {
        if (selectedMemberUID) {
            const userDocRef = doc(db, 'shirt-sizes', selectedMemberUID);

            await updateDoc(userDocRef, {
                shirtPickedUp: false,
            });

            setPickedUpMembers(prevMembers =>
                prevMembers.filter(member => member.uid !== selectedMemberUID)
            );
            setNotPickedUpMembers(prevMembers =>
                [...prevMembers, { ...selectedMember, shirtPickedUp: false } as PublicUserInfo]
            );

            setForceUpdate(forceUpdate + 1);
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} edges={["top"]}>
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className={`text-2xl font-bold text-black ${darkMode ? "text-white" : "text-black"}`}>Shirt Orders</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter */}
            <View className='flex-row mt-4 mx-5'>
                <TouchableOpacity
                    className={`flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectOption === "notPickedUp" && 'bg-primary-blue border-primary-blue'}`}
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
                    onPress={() => setSelectOption('notPickedUp')}
                >
                    <Text className={`font-bold ${selectOption === "notPickedUp" ? "text-white" : (darkMode ? "text-white" : "text-black")}`}>Pending Pick up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`ml-5 flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectOption === "pickedUp" && 'bg-primary-blue border-primary-blue'}`}
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
                    onPress={() => setSelectOption('pickedUp')}
                >
                    <Text className={`font-bold ${selectOption === "pickedUp" ? "text-white" : (darkMode ? "text-white" : "text-black")}`}>pickedUp</Text>
                </TouchableOpacity>
            </View>

            {(selectOption === "notPickedUp" && notPickedUpMembers && notPickedUpMembers.length === 0 && !loading) && (
                <View className='items-center justify-center'>
                    <View className='flex justify-center mt-4'>
                        <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>No Users to Check Off</Text>
                    </View>
                </View>
            )}

            {selectOption === "notPickedUp" && notPickedUpMembers && notPickedUpMembers.length > 0 && (
                <View className='mt-9 flex-1'>
                    <MembersList
                        key={forceUpdate}
                        handleCardPress={(uid) => {
                            setSelectedMemberUID(uid)
                            setConfirmVisible(true)
                        }}
                        users={notPickedUpMembers}
                    />
                </View>
            )}

            {(selectOption === "pickedUp" && pickedUpMembers && pickedUpMembers.length === 0 && !loading) && (
                <View className='items-center justify-center'>
                    <View className='flex justify-center mt-4'>
                        <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>No Users has picked up</Text>
                    </View>
                </View>
            )}

            {selectOption === "pickedUp" && pickedUpMembers && pickedUpMembers.length > 0 && (
                <View className='mt-9 flex-1'>
                    <MembersList
                        key={forceUpdate}
                        handleCardPress={(uid) => {
                            setSelectedMemberUID(uid)
                            setConfirmVisible(true)
                        }}
                        users={pickedUpMembers}
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

                    <MemberCard userData={selectedMember} />

                    <View>
                        <View>
                            <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Shirt Size: {selectedMemberDocuments?.shirtSize}</Text>

                            {selectedMemberDocuments?.shirtPickedUp ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        handleUncheck()
                                        setConfirmVisible(false);
                                    }}
                                    style={{ marginHorizontal: 10 }}
                                    className='mt-8 py-3 rounded-lg items-center justify-center bg-primary-blue'
                                >
                                    <Text className={`text-lg font-semibold text-white`}>Mark as not picked up</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        handleCheck()
                                        setConfirmVisible(false);
                                    }}
                                    style={{ marginHorizontal: 10 }}
                                    className='mt-8 py-3 rounded-lg items-center justify-center bg-primary-blue'
                                >
                                    <Text className={`text-lg font-semibold text-white`}>Mark as Picked Up</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>This is a shirt order tracking list</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>To begin verification, click on a member and view the shirt size they have chosen.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>After the shirt has been picked up, click the "Mark as Picked Up" button</Text>
                    </View>

                </View>
            </DismissibleModal>
        </SafeAreaView >
    )
}


interface shirtResponse {
    shirtSize: string;
    shirtPickedUp: boolean;
}

export default ShirtConfirm