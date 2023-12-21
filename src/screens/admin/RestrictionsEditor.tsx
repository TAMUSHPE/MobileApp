import { View, Text, Image, TouchableOpacity, ScrollView, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../../assets';
import { AdminDashboardParams } from '../../types/Navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPublicUserData, getWatchlist, getBlacklist } from '../../api/firebaseUtils';
import MembersList from '../../components/MembersList';
import { PublicUserInfo } from '../../types/User';

const RestrictionsEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [usersModalVisible, setUsersModalVisible] = useState(false);
    const [updated, setUpdated] = useState(false);
    const [watchlistUserInfo, setWatchlistUserInfo] = useState<PublicUserInfo[]>([]);
    const [blacklistUserInfo, setBlacklistUserInfo] = useState<PublicUserInfo[]>([]);
    const [changingWatchlist, setChangingWatchlist] = useState(false);
    const [changingBlacklist, setChangingBlacklist] = useState(false);

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

    function getCurrentWatchlist(): string[] {
        let watchlist: Array<string> = []
        watchlistUserInfo.forEach((userInfo) => (
            watchlist.push(userInfo.uid!)
        ));
        return watchlist;
    }

    function getCurrentBlacklist(): string[] {
        let blacklist: Array<string> = []
        blacklistUserInfo.forEach((userInfo) => (
            blacklist.push(userInfo.uid!)
        ));
        return blacklist;
    }

    useEffect(() => {
        const loadData = async () => {
            const loadedWatchlist = await getWatchlist();
            if (loadedWatchlist && loadedWatchlist.length > 0) {
                loadedWatchlist.forEach((uid: string) => {
                    fetchWatchlistUserData(uid)
                });
            }

            const loadedBlacklist = await getBlacklist();
            if (loadedBlacklist && loadedBlacklist.length > 0) {
                loadedBlacklist.forEach((uid: string) => {
                    fetchBlacklistUserData(uid)
                });
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

    const removeWatchlist = (uid: string) => {
        const updatedWatchlistUserInfo = watchlistUserInfo.filter(userInfo => userInfo.uid !== uid);
        setWatchlistUserInfo(updatedWatchlistUserInfo);
    };

    const removeBlacklist = (uid: string) => {
        const updatedBlacklistUserInfo = blacklistUserInfo.filter(userInfo => userInfo.uid !== uid);
        setBlacklistUserInfo(updatedBlacklistUserInfo);
    };


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
                <View className='p-6'>
                    <View className='flex-row mt-4 w-full '>
                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Watchlist</Text>
                            <TouchableOpacity onPress={() => { setUsersModalVisible(true); setChangingWatchlist(true); }}>
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
                                    onPress={() => { setUsersModalVisible(true); setChangingWatchlist(true); }}>
                                    <Text className='text-lg'>Add Users</Text>
                                </TouchableOpacity>
                            }
                        </View>

                        <View className='items-center flex-1'>
                            <Text className='text-gray-500 text-lg text-center'>Blacklist</Text>
                            <TouchableOpacity onPress={() => { setUsersModalVisible(true); setChangingBlacklist(true) }}>
                                {blacklistUserInfo.length === 0 &&
                                    <Text className='text-lg text-center'>Select Users</Text>
                                }
                            </TouchableOpacity>
                            {blacklistUserInfo.map((userInfo, index) => (
                                <View key={index}>
                                    <View className='flex-row'>
                                        <Text className='text-lg text-center'>{userInfo.name}</Text>
                                        <TouchableOpacity className="pl-2" onPress={() => removeBlacklist(userInfo.uid!)}>
                                            <Octicons name="x" size={25} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            {blacklistUserInfo.length > 0 &&
                                <TouchableOpacity
                                    className='text-center bg-pale-orange p-1 mt-2 rounded-md'
                                    onPress={() => { setUsersModalVisible(true); setChangingBlacklist(true) }}>
                                    <Text className='text-lg'>Add Users</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </View>


                <View className='w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='bg-blue-400 justify-center items-center rounded-md p-2'
                        onPress={async () => {
                            // setWatchlist(getCurrentWatchlist())
                            // setBlacklist(getCurrentBlacklist())
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
                    setChangingBlacklist(false);
                    setChangingWatchlist(false)
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
                            <TouchableOpacity className=" bg-pale-orange p-2 rounded-md" onPress={() => { setUsersModalVisible(false); setChangingBlacklist(false); setChangingWatchlist(false) }} >
                                <Text className='text-xl font-semibol'>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList
                            handleCardPress={(uid) => {
                                const currentWatchlist = getCurrentWatchlist()
                                const currentBlacklist = getCurrentBlacklist()
                                if (changingWatchlist && !currentWatchlist.includes(uid)) {
                                    if (currentBlacklist.includes(uid)) {
                                        removeBlacklist(uid)
                                    }
                                    fetchWatchlistUserData(uid)
                                    setChangingWatchlist(false)
                                }
                                if (changingBlacklist && !currentBlacklist.includes(uid)) {
                                    if (currentWatchlist.includes(uid)) {
                                        removeWatchlist(uid)
                                    }
                                    fetchBlacklistUserData(uid)
                                    setChangingBlacklist(false)
                                }
                                setUsersModalVisible(false)
                            }}
                            DEFAULT_NUM_LIMIT={null}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )
}

export default RestrictionsEditor