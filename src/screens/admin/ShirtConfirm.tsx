import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { db } from '../../config/firebaseConfig'
import { getMembersToShirtVerify } from '../../api/firebaseUtils'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { PublicUserInfo } from '../../types/User'
import { AdminDashboardParams } from '../../types/Navigation';
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'

const ShirtConfirm = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [pickedUpMembers, setPickedUpMembers] = useState<PublicUserInfo[]>([]);
    const [notPickedUpMembers, setNotPickedUpMembers] = useState<PublicUserInfo[]>([]);
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [selectedMemberDocuments, setSelectedMemberDocuments] = useState<shirtResponse | null>(null);

    const [selectOption, setSelectOption] = useState<string>('pickedUp');
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

    useEffect(() => {
        fetchMembers();
    }, []);

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
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold text-black">Shirt Orders</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className='flex-row mt-4'>
                <TouchableOpacity
                    className={`flex-row items-center justify-center border rounded-md py-2 px-4 mx-2 mb-2 ${selectOption === "pickedUp" ? 'bg-pale-blue' : 'border-pale-blue'}`}
                    onPress={() => setSelectOption('pickedUp')}
                >
                    <Text className={`font-bold ${selectOption === "pickedUp" ? 'text-white' : 'text-pale-blue'}`}>pickedUp</Text>
                </TouchableOpacity>


                <TouchableOpacity
                    className={`flex-row items-center justify-center border rounded-md py-2 px-4 mx-2 mb-2 ${selectOption === "notPickedUp" ? 'bg-pale-blue' : 'border-pale-blue'}`}
                    onPress={() => setSelectOption('notPickedUp')}
                >
                    <Text className={`font-bold ${selectOption === "notPickedUp" ? 'text-white' : 'text-pale-blue'}`}>NotPickedUp</Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <ActivityIndicator size="large" className='mt-8' />
            )}
            {(selectOption === "notPickedUp" && notPickedUpMembers && notPickedUpMembers.length === 0 && !loading) && (
                <View className='items-center justify-center'>
                    <View className='flex justify-center mt-4'>
                        <Text className='text-xl font-semibold'>No Users to Check Off</Text>
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
                        <Text className='text-xl font-semibold'>No Users has picked up</Text>
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

                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                            <Text style={{ marginHorizontal: 0 }} className='text-xl font-semibold'>Shirt Size:</Text>
                            <Text style={{ marginHorizontal: 5 }} className='text-xl font-semibold'>{selectedMemberDocuments?.shirtSize}</Text>

                            {selectedMemberDocuments?.shirtPickedUp ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        handleUncheck()
                                        setConfirmVisible(false);
                                    }}
                                    style={{ marginHorizontal: 10 }}
                                    className='py-3 rounded-lg items-center justify-center bg-[#ff0000] w-[47%]'
                                >
                                    <Text className='text-lg font-semibold'>Uncheck</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        handleCheck()
                                        setConfirmVisible(false);
                                    }}
                                    style={{ marginHorizontal: 10 }}
                                    className='py-3 rounded-lg items-center justify-center bg-[#00ff00] w-[47%]'
                                >
                                    <Text className='text-lg font-semibold'>Check Off</Text>
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
                        <Text className='text-md font-semibold'>Members that have bought shirts will appear here.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>To begin verification, click on a member and view the shirt size they have chosen.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Click the Check Off button to check off a member who has picked up their shirt.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>Members who have already picked up a shirt will still be available to view at the bottom of the screen</Text>
                    </View>


                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>If a mistake is made, a member who was previously Checked Off can be Unchecked.</Text>
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