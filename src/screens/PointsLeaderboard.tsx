import { View, Text, SafeAreaView, TouchableHighlight, ScrollView, ImageSourcePropType, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourcesStackNavigatorParams } from '../types/Navigation';
import RankCard from '../components/RankCard';
import { queryGoogleSpreadsheet, GoogleSheetsIDs } from '../api/fetchGoogleSheets'
import { getUserByEmail, getPublicUserData } from '../api/firebaseUtils'
import { Images } from '../../assets';
import { auth } from "../config/firebaseConfig"
import { RankChange, PublicUserInfoUID } from '../types/User';
import { GoogleSheetsResponse } from '../types/GoogleSheetsTypes';


const PointsLeaderboard = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackNavigatorParams> }) => {
    const [rankCards, setRankCards] = useState<PublicUserInfoUID[]>([])
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    /**
     * userPoints obtained from google sheets
     * userRank and rankChange are directly obtain from firebase
     * (this also means that rankChange is only obtain if user exist on firebase)
     * This method may be changed in the future
     */
    const [userPoints, setUserPoints] = useState(-1);
    const [userRank, setUserRank] = useState(-1);
    const [userRankChange, setUserRankChange] = useState<RankChange>('same');

    const prepUserData = async (data: GoogleSheetsResponse, offset: number): Promise<PublicUserInfoUID[]> => {
        const dataRow = data.table.rows;
        const usersDataPromises = dataRow.map(async (entry, index) => {
            const email = entry.c[2].v as string;
            const fetchUser = await getUserByEmail(email);
            const userData = fetchUser?.userData;
            const userUID = fetchUser?.userUID;
            const profileURL = userData?.photoURL;
            const rankChange = userData?.rankChange;
            return {
                name: `${entry.c[0].v} ${entry.c[1].v}`,
                email: email,
                points: +entry.c[3].f,
                pointsRank: index + offset + 1,
                photoURL: profileURL,
                rankChange: rankChange as RankChange,
                uid: userUID
            };
        });

        return await Promise.all(usersDataPromises);
    }

    const queryAndSetRanks = async (limit: number, offset: number) => {
        const query = `select A, B, C, D LIMIT ${limit} OFFSET ${offset}`;
        queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, query)
            .then(response => {
                setLoading(true);
                return prepUserData(response!, offset)
            }).then(data => {
                setRankCards([...rankCards, ...data]);
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
                setUserRank(user?.pointsRank ? user?.pointsRank : -1);
                setUserRankChange(user?.rankChange ? user?.rankChange as RankChange : "same" as RankChange);
                setUserPoints(user?.points ? user?.points : -1)
            }).then(() => {
                queryAndSetRanks(13, 0);
            })
        }
        fetchData();
    }, [])

    const colorMapping: Record<RankChange, string> = {
        "increased": "#AEF359",
        "same": "#7F7F7F",
        "decreased": "#B22222"
    };

    const RenderUserRankChange = () => {
        switch (userRankChange) {
            case "increased":
                return <Octicons name="chevron-up" size={24} color="#AEF359" />;
            case "decreased":
                return <Octicons name="chevron-down" size={24} color="#FF0000" />;
            default:
                return <Octicons name="dash" size={22} color="gray" />
        }
    };

    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(nativeEvent)) {
            setLoading(true);
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
                const offset = rankCards.length;
                queryAndSetRanks(13, offset);
                debounceTimer.current = null;
            }, 300);
        }
    };

    return (
        <SafeAreaView className="bg-pale-orange h-full">
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableHighlight onPress={() => navigation.goBack()} underlayColor="#EF9260">
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableHighlight>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold">Points Leaderboard</Text>
                </View>
                <View className="pr-4">
                    <TouchableHighlight onPress={() => navigation.navigate("PointsInfo")} underlayColor="#EF9260">
                        <Octicons name="info" size={25} color="black" />
                    </TouchableHighlight>
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
                            disabled={rankCards[1]?.uid === undefined}
                            onPress={() => { navigation.navigate("PublicProfile", { uid: rankCards[1]?.uid! }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rankCards[1]?.photoURL ? { uri: rankCards[1].photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </View>
                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-gray-400 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>2</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='mt-4 w-[100px]'>
                            <Text className='text-center text-xl font-bold '>{rankCards[1]?.name}</Text>
                        </View>
                    </View>

                    <View>
                        <TouchableOpacity
                            className='border-yellow-400 border-8 justify-end rounded-full h-[92px] w-[92px]'
                            disabled={rankCards[0]?.uid === undefined}
                            onPress={() => { navigation.navigate("PublicProfile", { uid: rankCards[0]?.uid! }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rankCards[0]?.photoURL ? { uri: rankCards[0].photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </View>

                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-yellow-400 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>1</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='mt-4 w-[100px]'>
                            <Text className='text-center text-xl font-bold'>{rankCards[0]?.name}</Text>
                        </View>
                    </View>

                    <View>
                        <TouchableOpacity
                            className='border-amber-700 border-8 justify-end mt-9 rounded-full h-[92px] w-[92px]'
                            disabled={rankCards[2]?.uid === undefined}
                            onPress={() => { navigation.navigate("PublicProfile", { uid: rankCards[2]?.uid! }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rankCards[2]?.photoURL ? { uri: rankCards[2].photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </View>

                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-amber-700 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>3</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='mt-4 w-[100px]'>
                            <Text className='text-center text-xl font-bold'>{rankCards[2]?.name}</Text>
                        </View>
                    </View>

                </View>




                <View className={`bg-white rounded-t-2xl flex-1 ${rankCards.length === 0 ? 'pb-96' : 'pb-20'}`}>
                    {/* User Ranking */}
                    {!initLoading && (
                        <View>
                            {userRank === -1 ? (

                                <View className='flex-col h-20 mx-4 px-4 mt-8 rounded-xl items-center'
                                    style={{ backgroundColor: colorMapping[userRankChange] }}>
                                    <Text className='text-xl font-medium'>You are unranked</Text>
                                    <Text className='text-lg text-center'>Learn how to earn points in the information screen</Text>
                                </View>
                            ) : (
                                <View className='flex-row h-20 mx-4 px-4 mt-8 rounded-xl items-center'
                                    style={{ backgroundColor: colorMapping[userRankChange] }}>
                                    <View className='flex-1 flex-row items-center'>
                                        <View className='w-[65%]'>
                                            <Text className='text-xl font-medium'>Your Ranking</Text>
                                            <View className='flex-row items-center'>
                                                <Octicons name="star-fill" size={24} color="black" />
                                                <Text className='text-xl font-medium ml-2'>{userPoints} pts</Text>
                                            </View>

                                        </View>
                                    </View>
                                    <View className='flex-row'>
                                        <Text className='text-xl font-medium mr-4'>{userRank}</Text>
                                        <View className='bg-white h-7 w-7 rounded-full items-center justify-center'>
                                            <RenderUserRankChange />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}


                    {/* Leaderboard */}
                    {rankCards.slice(3).map((userData, index) => (
                        <RankCard key={index + 3} userData={userData} navigation={navigation} />
                    ))}
                    {loading && (
                        <ActivityIndicator className="mt-4" size={"large"} />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView >
    )
}

export default PointsLeaderboard