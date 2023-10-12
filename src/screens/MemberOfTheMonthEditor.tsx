import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal, Alert, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { setMemberOfTheMonth, getPublicUserData, getMemberOfTheMonth } from '../api/firebaseUtils';
import MembersList from '../components/MembersList';
import { PublicUserInfoUID } from '../types/User';
import { Committee } from '../types/Committees';

const MemberOfTheMonthEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [committeeData, setCommitteeData] = useState<Committee>();
    const [headModalVisible, setHeadModalVisible] = useState(false);
    const [headUserInfo, setHeadUserInfo] = useState<PublicUserInfoUID | null>(null);
    const [updated, setUpdated] = useState(false);
    const [localMemberOfTheMonth, setlocalMemberOfTheMonth] = useState<{uid: string, name: string} | null>(null);

    const insets = useSafeAreaInsets();

    const fetchHeadUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setHeadUserInfo({
                ...fetchedInfo,
                uid,
            });
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const loadedMemberOfTheMonth = await getMemberOfTheMonth();
            if (loadedMemberOfTheMonth?.uid) {
                await fetchHeadUserData(loadedMemberOfTheMonth.uid);
                setlocalMemberOfTheMonth({ uid: loadedMemberOfTheMonth.uid, name: headUserInfo?.name! });
            } else {
                setlocalMemberOfTheMonth(null);
            }
        };

        setHeadUserInfo(null);
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
                <View className='mt-9 p-6'>
                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Member of the Month</Text>
                            <TouchableOpacity onPress={() => setHeadModalVisible(true)}>
                                <Text className='text-lg text-center'>{headUserInfo?.name || "Select a Member"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='bg-blue-400 justify-center items-center rounded-md p-2'
                        onPress={() => {
                            setMemberOfTheMonth(headUserInfo?.uid!, headUserInfo?.name!),
                            setUpdated(true)
                        }}
                    >
                        <Text className='text-xl text-semibold'>Confirm Change</Text>
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
                visible={headModalVisible}
                onRequestClose={() => {
                    setHeadModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Head</Text>
                        </View>
                        <View className='pl-6'>
                            <TouchableOpacity className=" bg-pale-orange p-2 rounded-md" onPress={() => setHeadModalVisible(false)} >
                                <Text className='text-xl font-semibol'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList handleCardPress={(uid) => {
                            setCommitteeData({ ...committeeData!, headUID: uid })
                            setHeadModalVisible(false)
                            fetchHeadUserData(uid)
                        }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )
}

export default MemberOfTheMonthEditor