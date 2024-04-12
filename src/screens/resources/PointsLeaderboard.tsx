import { View, Text, ScrollView, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from "../../config/firebaseConfig"
import { getPublicUserData } from '../../api/firebaseUtils'
import { RankChange, PublicUserInfo } from '../../types/User';
import { ResourcesStackParams } from '../../types/Navigation';
import { Images } from '../../../assets';
import DismissibleModal from '../../components/DismissibleModal';
import RankCard from './RankCard';
import { collection, getDocs, limit, orderBy, query, startAt, where } from 'firebase/firestore';

const PointsLeaderboard = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const [fetchedUsers, setFetchedUsers] = useState<PublicUserInfo[]>([])
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [initLoading, setInitLoading] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [endOfData, setEndOfData] = useState<boolean>(false);
    const [infoVisible, setInfoVisible] = useState<boolean>(false);

    /**
     * userPoints obtained from google sheets
     * userRank and rankChange are directly obtain from firebase
     * (this also means that rankChange is only obtain if user exist on firebase)
     * This method may be changed in the future
     */
    const [currentUserInfo, setCurrentUserInfo] = useState<PublicUserInfo>();

    /**
     * Returns a list of user data sorted by their rank.
     */
    const getSortedUserData = async (amount: number, offset: number): Promise<PublicUserInfo[]> => {
        const userRef = collection(db, 'users');
        const sortedUsersQuery = query(userRef, orderBy("pointsRank", "asc"), limit(amount), startAt(offset));
        const data = (await getDocs(sortedUsersQuery)).docs;

        setEndOfData(data.length < amount);

        return data.map((value) => {
            return value.data();
        });
    }

    /**
     * Obtains user data from firebase and appends the data to the current collection.
     */
    const queryAndSetRanks = async (amount: number, offset: number) => {
        getSortedUserData(amount, offset)
            .then(data => {
                setFetchedUsers([...fetchedUsers, ...data]);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            }).finally(() => {
                setLoading(false);
                setInitLoading(false);
            })
    }

    useEffect(() => {
        const fetchData = async () => {
            getPublicUserData(auth?.currentUser?.uid!).then(user => {
                setCurrentUserInfo(user);
            }).then(() => {
                queryAndSetRanks(100, 0);
            })
        }
        fetchData();
    }, []);

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent) || endOfData) return;

        setLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            const offset = fetchedUsers.length;
            queryAndSetRanks(50, offset);
            debounceTimer.current = null;
        }, 300);
    }, [fetchedUsers, endOfData]);

    return (
        <SafeAreaView className="bg-pale-blue h-full" edges={["top"]} >
            <StatusBar style="light" />
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold text-white">Points Leaderboard</Text>
                </View>
                <View className="pr-4">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={400}
                bounces={false}
            >
                {/* Top 3 */}
                <View className='h-64 flex-row justify-between pt-5 mx-10'>
                    <View>
                        <TouchableOpacity
                            className='border-gray-400 border-8 justify-end mt-9 rounded-full h-[92px] w-[92px]'
                            disabled={fetchedUsers[1]?.uid === undefined}
                            onPress={() => { navigation.navigate("PublicProfile", { uid: fetchedUsers[1]?.uid! }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={fetchedUsers[1]?.photoURL ? { uri: fetchedUsers[1].photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </View>
                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-gray-400 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>2</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='mt-4 w-[100px]'>
                            <Text className='text-center text-xl font-bold text-white '>{fetchedUsers[1]?.name}</Text>
                        </View>
                    </View>

                    <View>
                        <TouchableOpacity
                            className='border-yellow-400 border-8 justify-end rounded-full h-[92px] w-[92px]'
                            disabled={fetchedUsers[0]?.uid === undefined}
                            onPress={() => { navigation.navigate("PublicProfile", { uid: fetchedUsers[0]?.uid! }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={fetchedUsers[0]?.photoURL ? { uri: fetchedUsers[0].photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </View>

                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-yellow-400 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>1</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='mt-4 w-[100px]'>
                            <Text className='text-center text-xl font-bold text-white'>{fetchedUsers[0]?.name}</Text>
                        </View>
                    </View>

                    <View>
                        <TouchableOpacity
                            className='border-amber-700 border-8 justify-end mt-9 rounded-full h-[92px] w-[92px]'
                            disabled={fetchedUsers[2]?.uid === undefined}
                            onPress={() => { navigation.navigate("PublicProfile", { uid: fetchedUsers[2]?.uid! }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={fetchedUsers[2]?.photoURL ? { uri: fetchedUsers[2].photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </View>

                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-amber-700 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>3</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='mt-4 w-[100px]'>
                            <Text className='text-center text-xl font-bold text-white'>{fetchedUsers[2]?.name}</Text>
                        </View>
                    </View>

                </View>

                <View className={`bg-[#F9F9F9] rounded-t-2xl flex-1 ${fetchedUsers.length === 0 && "h-screen"}`}>
                    {/* User Ranking */}
                    {!initLoading && (
                        <View>
                            {currentUserInfo?.pointsRank !== undefined ? (
                                <View className='flex-col h-20 mx-4 px-4 mt-8 rounded-xl items-center justify-center'
                                    style={{ backgroundColor: colorMapping[currentUserInfo?.rankChange ?? "same"] }}>
                                    <Text className='text-xl font-medium'>You are unranked</Text>
                                </View>
                            ) : (
                                <View className='flex-row h-20 mx-4 px-4 mt-8 rounded-xl items-center'
                                    style={{ backgroundColor: colorMapping[currentUserInfo?.rankChange ?? "same"] }}>

                                    {currentUserInfo?.points ? (
                                        <RankCard key="userCard" userData={currentUserInfo} navigation={navigation} />
                                    ) : (<Text className='text-xl font-medium'>You don't any have points.</Text>)}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Leaderboard */}
                    {fetchedUsers.slice(3).map((userData, index) => (
                        <RankCard key={index + 3} userData={userData} navigation={navigation} />
                    ))}
                    <View className={`justify-center h-20 items-center ${fetchedUsers.length === 0 && "h-[50%]"}`}>
                        {loading && (
                            <ActivityIndicator size={"large"} />
                        )}
                        {endOfData && (
                            <View className='pb-6 items-center justify-center'>
                                <Text>
                                    No more ranked users
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >

                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'
                    style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color="black" />
                            <Text className='text-2xl font-semibold ml-2'>Points FAQ</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text className='text-xl font-semibold'>What are MemberSHPE points?</Text>
                        <Text className='text-lg font-semibold text-gray-400'>MemberSHPE Points are .....</Text>
                    </View>

                    <View>
                        <Text className='text-xl font-semibold'>How to earn points?</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+1 Upload Old Exam</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+2 Upload Old Exam w/ A</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+1 General Meetings & Events</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+1 Wear SHPE gear</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+2 Community Service per hour</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+1 #WearItWednesday Post</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+1 Fitness Friday</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+3 Professional Workshop</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+2 Academic Workshop</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+1 Academic Social</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+2 General Meeting Sign Out</Text>
                        <Text className='text-lg font-semibold text-gray-400'>+4 Election</Text>
                    </View>

                </View>
            </DismissibleModal>
        </SafeAreaView >
    )
}

const colorMapping: Record<RankChange, string> = {
    "increased": "#AEF359",
    "same": "#aFaFaF",
    "decreased": "#B22222"
};

export default PointsLeaderboard;
