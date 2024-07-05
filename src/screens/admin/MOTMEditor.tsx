import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { getMOTM, getMembersExcludeOfficers, setMOTM } from '../../api/firebaseUtils';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { HomeStackParams } from '../../types/navigation';
import { PublicUserInfo } from '../../types/user';
import MembersList from '../../components/MembersList';
import DismissibleModal from '../../components/DismissibleModal';
import MemberCard from '../../components/MemberCard';
import { useFocusEffect } from '@react-navigation/core';
import MOTMCard from '../../components/MOTMCard';
import SwipeableMemberList from '../../components/SwipeableMemberList';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserContext } from '../../context/UserContext';

const functions = getFunctions();

const MOTMEditor = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [localSuggestedMOTM, setSuggestedLocalMOTM] = useState<PublicUserInfo[]>();
    const calculateMOTM = httpsCallable(functions, 'calculateMOTM');

    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [invisibleConfirmModal, setInvisibleConfirmModal] = useState(false);
    const [membersModal, setMembersModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Very Hacky way to force update MOTM Card from both swipeable and modal
    const [forceUpdate, setForceUpdate] = useState(0);
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            if (selectedMemberUID) {
                setConfirmVisible(true);
                setInvisibleConfirmModal(true);
            }
            if (selectedMemberUID && members) {
                const memberData = members.find(member => member.uid === selectedMemberUID);
                if (memberData) {
                    setSelectedMember(memberData);
                } else {
                    console.error('No data found for member with UID:', selectedMemberUID);
                }
            }
        }, [selectedMemberUID, members])
    );

    const fetchMembers = async () => {
        try {
            const fetchedMembers = await getMembersExcludeOfficers();
            setMembers(fetchedMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    useEffect(() => {
        fetchMembers();
        const fetchSuggestedLocalMOTM = async () => {
            setLoading(true);
            try {
                const response = await calculateMOTM();
                if (response && response.data) {
                    setSuggestedLocalMOTM(response.data as PublicUserInfo[]);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestedLocalMOTM();
    }, []);

    // Logic for expiration modal closing is more complicated then simply setting visibility to false
    // so this is needed to deal with dismissible modal
    useEffect(() => {
        if (!confirmVisible) {
            setSelectedMemberUID(undefined);
            setSelectedMember(undefined);
        }
    }, [confirmVisible])

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} edges={["top"]}>
                <View className='flex-row items-center h-10'>
                    <View className='pl-6'>
                        <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                            <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                    <View className='flex-1 items-center'>
                        <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Member of the Month</Text>
                    </View>
                    <View className="pr-6">
                        <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                            <Octicons name="info" size={25} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='mt-8'>
                    <MOTMCard navigation={navigation} key={forceUpdate} />
                </View>


                <TouchableOpacity
                    className={`mx-4 px-4 py-3 mt-8 rounded-md ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                    onPress={() => setMembersModal(true)}
                >
                    <Text className={`font-bold text-xl ${darkMode ? "text-white" : "text-black"}`}>Select another member</Text>
                </TouchableOpacity>

                <View className='mx-5'>
                    <Text className={`text-2xl font-bold mb-3 mt-10 ${darkMode ? "text-white" : "text-black"}`}>Suggestions</Text>
                </View>

                {loading && <ActivityIndicator size="small" className='mt-5' />}

                <SwipeableMemberList
                    userData={localSuggestedMOTM!}
                    onSwipe={(userData: any) => { setForceUpdate(prev => prev + 1); }}
                />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={membersModal}
                    onRequestClose={() => {
                        setMembersModal(false);
                    }}
                >
                    <View
                        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                        className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                    >
                        <View className='h-screen'>
                            <View className='flex-row items-center h-10 mb-4 justify-end'>
                                <View className='w-screen absolute'>
                                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>Select User</Text>
                                </View>
                                <TouchableOpacity
                                    className='px-4 mr-3'
                                    onPress={() => setMembersModal(false)}
                                >
                                    <Octicons name="x" size={26} color={darkMode ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>

                            <MembersList
                                handleCardPress={(uid) => {
                                    setSelectedMemberUID(uid)
                                    setMembersModal(false);
                                }}
                                users={members}
                            />
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

                        <MemberCard userData={selectedMember!} />


                        <Text className={`text-md ${darkMode ? "text-white" : "text-black"}`}>You will be setting {selectedMember?.name} as the member of the month.</Text>


                        <View className='mt-20 flex-row space-x-6'>
                            <TouchableOpacity
                                onPress={() => {
                                    setMOTM(selectedMember!)
                                    setConfirmVisible(false)
                                    setForceUpdate(prev => prev + 1);
                                }}
                                className='flex-1 bg-primary-blue items-center py-2 rounded-lg justify-center'
                            >
                                <Text className='text-lg font-semibold text-white'>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setConfirmVisible(false)}
                                className='flex-1 items-center py-2 rounded-lg justify-center'
                            >
                                <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
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
                                <Text className='text-xl font-semibold ml-2'>Instructions</Text>
                            </View>
                            <View>
                                <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                    <Octicons name="x" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className='w-[85%]'>
                            <Text className='text-md font-semibold'>The current Member of the Month is displayed.</Text>
                        </View>

                        <View className='w-[85%]'>
                            <Text className='text-md font-semibold'>Change the the member of the month by either selecting the suggested member or select another user from the list</Text>
                        </View>

                        <View className='w-[85%]'>
                            <Text className='text-md font-semibold'>The suggested member is chosen based on the highest point for the month, non-repeated member, and not an office, representative or lead</Text>
                        </View>
                    </View>
                </DismissibleModal>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}

export default MOTMEditor