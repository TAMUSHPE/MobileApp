import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { getMOTM, getMembersExcludeOfficers, setMOTM } from '../../api/firebaseUtils';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { AdminDashboardParams } from '../../types/Navigation';
import { PublicUserInfo } from '../../types/User';
import MembersList from '../../components/MembersList';
import DismissibleModal from '../../components/DismissibleModal';
import MemberCard from '../../components/MemberCard';
import { useFocusEffect } from '@react-navigation/core';
import MOTM from '../../components/MOTMCard';
import SwipeableMemberList from '../../components/SwipeableMemberList';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const functions = getFunctions();

const MOTMEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [selectedMemberUID, setSelectedMemberUID] = useState<string>();
    const [selectedMember, setSelectedMember] = useState<PublicUserInfo>();
    const [localMOTM, setLocalMOTM] = useState<PublicUserInfo>();
    const [localSuggestedMOTM, setSuggestedLocalMOTM] = useState<PublicUserInfo[]>();
    const calculateMOTM = httpsCallable(functions, 'calculateMOTM');

    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [invisibleConfirmModal, setInvisibleConfirmModal] = useState(false);
    const [membersModal, setMembersModal] = useState(false);
    const [loadingMember, setLoadingMember] = useState(true);
    const [loadingMOTM, setLoadingMOTM] = useState(true);

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
        setLoadingMember(true);
        try {
            const fetchedMembers = await getMembersExcludeOfficers();
            setMembers(fetchedMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoadingMember(false);
        }
    };

    const fetchMOTM = async () => {
        try {
            const fetchedMOTM = await getMOTM();
            setLocalMOTM(fetchedMOTM);
        } catch (error) {
            console.error('Error fetching member of the month:', error);
        } finally {
            setLoadingMOTM(false);
        }
    }

    useEffect(() => {
        fetchMembers();
        const fetchSuggestedLocalMOTM = async () => {
            try {
                const response = await calculateMOTM();
                if (response && response.data) {
                    setSuggestedLocalMOTM(response.data as PublicUserInfo[]);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
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
            <SafeAreaView className='flex-1' edges={["top"]}>
                <View className='flex-row items-center h-10'>
                    <View className='pl-6'>
                        <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View className='flex-1 items-center'>
                        <Text className="text-2xl font-bold text-black">MOTM</Text>
                    </View>
                    <View className="pr-6">
                        <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                            <Octicons name="info" size={25} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                {(loadingMOTM && loadingMember) ? (
                    <ActivityIndicator size="large" className='mt-8' />
                ) : (
                    <View className='flex-1'>
                        <MOTM
                            userData={localMOTM}
                            navigation={navigation}
                            handleCardPress={() => {
                                navigation.navigate("PublicProfile", { uid: localMOTM?.uid! })
                            }}
                        />

                        <View className='mt-6 mx-5 pb-3'>
                            <Text className='font-bold text-xl'>Suggested MOTM</Text>
                        </View>
                        <SwipeableMemberList userData={localSuggestedMOTM!}/> 

                        <TouchableOpacity className='mx-4 px-4 py-3 rounded-md bg-gray-300'
                            onPress={() => setMembersModal(true)}
                        >
                            <Text className='font-bold text-xl'>Select another member</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
                        className='bg-white'>

                        <View className='flex-row items-center h-10 mb-4 justify-end'>
                            <View className='w-screen absolute'>
                                <Text className="text-2xl font-bold justify-center text-center">Select User</Text>
                            </View>
                            <TouchableOpacity
                                className='px-4 mr-3'
                                onPress={() => setMembersModal(false)}
                            >
                                <Octicons name="x" size={26} color="black" />
                            </TouchableOpacity>
                        </View>


                        <View className="h-[100%] w-[100%] bg-white">
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
                    visible={confirmVisible && invisibleConfirmModal}
                    setVisible={setConfirmVisible}
                >
                    <View className='flex opacity-100 bg-white rounded-md p-6' style={{ minWidth: 325 }}>
                        <View className='flex-row items-center justify-between'>
                            <View className='flex-row items-center'>
                                <Octicons name="alert" size={24} color="black" />
                                <Text className='text-xl font-semibold ml-2'>Confirm Member</Text>
                            </View>
                            <View>
                                <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                    <Octicons name="x" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className='mt-5'>
                            <MemberCard
                                userData={selectedMember!}
                                navigation={navigation}
                                handleCardPress={() => {
                                    navigation.navigate("PublicProfile", { uid: selectedMemberUID! })
                                    setInvisibleConfirmModal(false)
                                }} />
                        </View>
                        <View className='flex-row justify-around'>
                            <TouchableOpacity
                                className='bg-[#AEF359] w-[40%] items-center py-2 rounded-md'
                                onPress={() => {
                                    setMOTM(selectedMember!)
                                    setConfirmVisible(false)
                                    fetchMOTM();
                                }}
                            >
                                <Text className='font-semibold text-lg'>Confirm</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='w-[40%] items-center py-2 rounded-md'
                                onPress={() => setConfirmVisible(false)}
                            >
                                <Text className='font-semibold text-lg'>Cancel</Text>
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
            </SafeAreaView >
        </GestureHandlerRootView>
    )
}

export default MOTMEditor