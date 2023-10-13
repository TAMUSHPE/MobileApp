import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Modal, Alert, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';
import { AdminDashboardParams } from '../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import {getPublicUserData} from '../api/firebaseUtils';
import MembersList from '../components/MembersList';
import { PublicUserInfoUID } from '../types/User';
import { userInfo } from 'os';

const RestrictionsEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [usersModalVisible, setUsersModalVisible] = useState(false);
    const [updated, setUpdated] = useState(false);
    const [watchlistUserInfo, setWatchlistUserInfo] = useState<PublicUserInfoUID[]>([]);
    const [blacklistUserInfo, setBlacklistUserInfo] = useState<PublicUserInfoUID[]>([]);
    const [watchlist, setWatchlist] = useState<string[]>();
    const [blacklist, setBlacklist] = useState<string[]>();

    const insets = useSafeAreaInsets();

    const fetchWatchlistUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setWatchlistUserInfo(prevState => [...prevState, { ...fetchedInfo, uid }]);
        }
    }

    const fetchBlacklistUserData = async (uid: string) => {
        const fetchedInfo = await getPublicUserData(uid);
        if (fetchedInfo) {
            setBlacklistUserInfo(prevState => [...prevState, { ...fetchedInfo, uid }]);
        }
    }

    useEffect(() => {
        const loadData = async () => {
            
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

    const addWatchlist = (uid: string) => {
        watchlist?.push(uid)
        fetchWatchlistUserData(uid)
    }

    const removeWatchlist = (uid: string) => {
        const updatedWatchlistUserInfo = watchlistUserInfo.filter(userInfo => userInfo.uid !== uid);
        setWatchlistUserInfo(updatedWatchlistUserInfo);
    };


    return (
        <SafeAreaView>
            <ScrollView>
                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">Restrictions Editor</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={navigation.goBack}>
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Image */}
                <View className='justify-center items-center'>
                    <Image
                        className="mt-2 h-60 w-[90%] bg-gray-700 rounded-xl"
                        source={Images.COMMITTEE}
                    />
                </View>

                {/* Form */}
                <View className='p-6'>
                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Watchlist</Text>
                            <TouchableOpacity onPress={() => setUsersModalVisible(true)}>
                                {watchlistUserInfo.length === 0 &&
                                    <Text className='text-lg text-center'>Select Users</Text>
                                }
                            </TouchableOpacity>
                            {watchlistUserInfo.map((userInfo, index) => (
                                <View key={index}>
                                    <View className='flex-row'>
                                        <Text className='text-lg text-center'>{userInfo.name}</Text>
                                        <TouchableOpacity className="pl-2" onPress={() => removeWatchlist(userInfo.uid!)}>
                                            <Octicons name="x" size={25} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {watchlistUserInfo.length > 0 &&
                                <TouchableOpacity
                                    className='text-center bg-pale-orange p-1 mt-2 rounded-md'
                                    onPress={() => setUsersModalVisible(true)}>
                                    <Text className='text-lg'>Add Users</Text>
                                </TouchableOpacity>
                            }
                        </View>

                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Blacklist</Text>
                            <TouchableOpacity onPress={() => setUsersModalVisible(true)}>
                                {blacklistUserInfo.length === 0 &&
                                    <Text className='text-lg text-center'>Select Users</Text>
                                }
                            </TouchableOpacity>
                            {blacklistUserInfo.length > 0 &&
                                <TouchableOpacity
                                    className='text-center bg-pale-orange p-1 mt-2 rounded-md'
                                    onPress={() => setUsersModalVisible(true)}>
                                    <Text className='text-lg'>Add Users</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </View>


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='bg-blue-400 justify-center items-center rounded-md p-2'
                        onPress={() => {

                            setUpdated(true)
                        }}
                    >
                        <Text className='text-xl text-semibold'>Update Restrictions</Text>
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
                visible={usersModalVisible}
                onRequestClose={() => {
                    setUsersModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a User</Text>
                        </View>
                        <View className='pl-6'>
                            <TouchableOpacity className=" bg-pale-orange p-2 rounded-md" onPress={() => setUsersModalVisible(false)} >
                                <Text className='text-xl font-semibol'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList handleCardPress={(uid) => {
                            addWatchlist(uid)
                            setUsersModalVisible(false)
                            console.log(watchlist)
                        }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )
}

export default RestrictionsEditor