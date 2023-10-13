import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal, Alert, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../../assets';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { setMemberOfTheMonth, getPublicUserData, getMemberOfTheMonth } from '../api/firebaseUtils';
import MembersList from '../components/MembersList';
import { PublicUserInfoUID } from '../types/User';

const MemberOfTheMonthEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [memberInfo, setMemberInfo] = useState<PublicUserInfoUID | null>(null);
    const [updated, setUpdated] = useState(false);
    const [localMemberOfTheMonth, setLocalMemberOfTheMonth] = useState<string | null>(null);

    const insets = useSafeAreaInsets();
    console.log(localMemberOfTheMonth)
    const fetchMemberData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setMemberInfo({
                ...fetchedInfo,
                uid,
            });
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const { uid, name } = await getMemberOfTheMonth() || {};
            if (uid) {
                await fetchMemberData(uid);
            } else {
                setMemberInfo({ name: name });
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (updated) {
            timerId = setTimeout(() => {
                setUpdated(false);
            }, 3000);
        }
        return () => {
            clearTimeout(timerId);
        };
    }, [updated]);

    return (
        <SafeAreaView>
            <ScrollView>
                {/* Image */}
                <View className='justify-center items-center'>
                    <Image
                        className="mt-2 h-60 w-[90%] bg-gray-700 rounded-xl"
                        source={Images.COMMITTEE}
                    />
                </View>

                {/* Form */}
                <View className='p-6 items-center flex-1'>
                    <View className='items-center flex-1'>
                        <Text className='text-gray-500 text-lg text-center'>Current Member of the Month</Text>
                        <Text className='text-lg text-center'>{memberInfo?.name}</Text>
                    </View>

                    <View className='mt-4 items-center flex-1'>
                        <Text className='text-gray-500 text-lg text-center'>Select a User</Text>
                        <TouchableOpacity
                            onPress={() => setMemberModalVisible(true)}
                            activeOpacity={0.5}
                            className='bg-[#e4e4e4] justify-center items-center rounded-md pr-9 pl-9'
                        >
                            <Text className='text-lg text-center'>Click</Text>
                        </TouchableOpacity>
                    </View>

                    <View className='flex-row items-center mt-7 mb-4'>
                        <View className='flex-1 bg-gray-400 h-0.5' />
                        <Text className='mx-2 px-2 text-gray-600 text-lg'>or manually enter a name</Text>
                        <View className='flex-1 bg-gray-400 h-0.5' />
                    </View>

                    <View className='flex-row'>
                        <Text>Name: </Text>
                        <TextInput
                            placeholder="Full Name"
                            className="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1"
                            onChangeText={(name: string) => {
                                setLocalMemberOfTheMonth("")
                                setMemberInfo({ uid: "", name: name })
                            }}
                        />
                    </View>

                </View>


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity
                        activeOpacity={0.5}
                        className='bg-blue-400 justify-center items-center rounded-md p-2'
                        onPress={() => {
                            console.log(memberInfo?.name)
                            console.log(localMemberOfTheMonth)
                            if (memberInfo?.name) {
                                setMemberOfTheMonth(localMemberOfTheMonth || "", memberInfo?.name)
                                setUpdated(true)
                            } else {
                                Alert.alert("Please Select a member of the month")
                            }
                        }}
                    >
                        <Text className='text-xl text-semibold'>Confirm</Text>
                    </TouchableOpacity>
                </View>
                <View className='justify-center items-center'>
                    {updated && <Text className='text-green-500'>Information has been updated</Text>}
                </View>

                <View className='pb-32'></View>
            </ScrollView >
            <Modal
                animationType="slide"
                transparent={true}
                visible={memberModalVisible}
                onRequestClose={() => {
                    setMemberModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Member</Text>
                        </View>
                        <View className='pl-6'>
                            <TouchableOpacity activeOpacity={0.5} className=" bg-pale-orange p-2 rounded-md" onPress={() => setMemberModalVisible(false)} >
                                <Text className='text-xl font-semibol'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList handleCardPress={(uid) => {
                            setLocalMemberOfTheMonth(uid)
                            setMemberModalVisible(false)
                            fetchMemberData(uid)
                        }} />

                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )
}

export default MemberOfTheMonthEditor