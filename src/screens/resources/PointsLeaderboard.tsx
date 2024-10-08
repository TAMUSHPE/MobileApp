import { View, Text, ScrollView, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { getSortedUserData } from '../../api/firebaseUtils';
import { PublicUserInfo } from '../../types/user';
import { ResourcesStackParams } from '../../types/navigation';
import RankCard from './RankCard';

const PointsLeaderboard = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [initLoading, setInitLoading] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedUsers, setFetchedUsers] = useState<PublicUserInfo[]>([])
    const [filter, setFilter] = useState<string>("allTime");
    const [endOfData, setEndOfData] = useState<boolean>(false);
    const [lastVisible, setLastVisible] = useState<any>(null);

    /**
     * Obtains user data from firebase and appends the data to the current collection.
     */
    const fetchSortedUserData = async (amount: number, lastDoc: any) => {
        if (isFetching) return;
        setIsFetching(true);

        getSortedUserData(amount, lastDoc, filter)
            .then(({ data, lastVisible }) => {
                setEndOfData(data.length < amount);
                setFetchedUsers(prevUsers => [...prevUsers, ...data]);
                setLastVisible(lastVisible);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            })
            .finally(() => {
                setLoading(false);
                setInitLoading(false);
                setIsFetching(false);
            });
    };

    useEffect(() => {
        setLoading(true);

        setFetchedUsers([]);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        setLastVisible(null);
        setEndOfData(false);

        fetchSortedUserData(30, null);

        setLoading(false);
    }, [filter]);

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent) || endOfData || isFetching) return;

        setLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            fetchSortedUserData(20, lastVisible);
            debounceTimer.current = null;
        }, 300);
    }, [fetchedUsers, endOfData, lastVisible, isFetching]);

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center justify-between'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Points Leaderboard</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View
                className='flex-row mt-4 h-14 mx-4 rounded-3xl'
                style={{ backgroundColor: darkMode ? 'rgba(125,125,125,0.5)' : 'rgba(0.5,0.5,0.5,0.5)' }}
            >
                <TouchableOpacity
                    className={`items-center justify-center flex-1 rounded-3xl m-1 ${filter == "allTime" && "bg-primary-blue"}`}
                    onPress={() => {
                        setFetchedUsers([]);
                        setLastVisible(null);
                        setInitLoading(true);
                        setFilter("allTime")
                    }}
                >
                    <Text className='text-white text-xl font-bold'>All Time</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`items-center justify-center flex-1 rounded-3xl m-1 ${filter == "monthly" && "bg-primary-blue"}`}
                    onPress={() => {
                        setFetchedUsers([]);
                        setLastVisible(null);
                        setInitLoading(true);
                        setFilter("monthly")
                    }}
                >
                    <Text className='text-white text-xl font-bold'>Monthly</Text>
                </TouchableOpacity>
            </View>

            <View className='pb-4' />

            <ScrollView
                onScroll={handleScroll}
                ref={scrollViewRef}
            >
                <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"} ${fetchedUsers.length === 0 && "h-screen"}`}>
                    {!initLoading && (
                        <View>
                            {/* User Ranking */}
                            {filter == "allTime" && (
                                <View>
                                    {userInfo?.publicInfo?.pointsRank === undefined ? (
                                        <View className='flex-col h-20 mx-4 px-4 mt-8 rounded-xl items-center justify-center'>
                                            <Text className='text-xl font-medium'>You are not ranked</Text>
                                        </View>
                                    ) : (
                                        userInfo?.publicInfo?.points ? (
                                            <RankCard key="userCard" userData={userInfo.publicInfo} navigation={navigation} rank={userInfo.publicInfo.pointsRank} />
                                        ) : (
                                            <View className='flex-col h-20 mx-4 px-4 mt-8 rounded-xl items-center justify-center'>
                                                <Text className='text-xl font-medium'>You don't have any points</Text>
                                            </View>
                                        )
                                    )}

                                    <View className={` mb-2 mt-8 mx-4 h-[2px] rounded-full ${darkMode ? "bg-grey-dark" : "bg-grey-light"}`} />
                                </View>

                            )}

                            {/* Leaderboard */}
                            {fetchedUsers.map((userData, index) => (
                                <RankCard
                                    key={index}
                                    userData={userData}
                                    navigation={navigation}
                                    rank={filter === "allTime" ? userData.pointsRank! : index + 1}
                                    monthlyPoints={filter === "monthly" ? userData.pointsThisMonth : undefined}
                                />
                            ))}
                        </View>
                    )}

                    <View className={`justify-center h-20 items-center ${fetchedUsers.length === 0 && "h-[50%]"}`}>
                        {(loading || initLoading) && (
                            <ActivityIndicator size={"small"} />
                        )}
                        {endOfData && (
                            <View className='pb-6 items-center justify-center'>
                                <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>No more ranked users</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default PointsLeaderboard;