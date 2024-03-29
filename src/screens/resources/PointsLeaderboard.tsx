import { View, Text, ScrollView, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { auth } from "../../config/firebaseConfig"
import { queryGoogleSpreadsheet, GoogleSheetsIDs } from '../../api/fetchGoogleSheets'
import { getUserByEmail, getPublicUserData } from '../../api/firebaseUtils'
import { RankChange, PublicUserInfo } from '../../types/User';
import { GoogleSheetsResponse } from '../../types/GoogleSheetsTypes';
import { ResourcesStackParams } from '../../types/Navigation';
import { Images } from '../../../assets';
import DismissibleModal from '../../components/DismissibleModal';
import RankCard from './RankCard';

const PointsLeaderboard = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const [rankCards, setRankCards] = useState<PublicUserInfo[]>([])
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [endOfData, setEndOfData] = useState(false);
    const [nullDataOffset, setNullDataOffset] = useState(0);
    const [infoVisible, setInfoVisible] = useState(false);

    /**
     * userPoints obtained from google sheets
     * userRank and rankChange are directly obtain from firebase
     * (this also means that rankChange is only obtain if user exist on firebase)
     * This method may be changed in the future
     */
    const [userPoints, setUserPoints] = useState(-1);
    const [userRank, setUserRank] = useState(-1);
    const [userRankChange, setUserRankChange] = useState<RankChange>('same');

    const prepPointSheet = async (data: GoogleSheetsResponse, offset: number): Promise<PublicUserInfo[]> => {
        const dataRow = data.table?.rows;
        if (!dataRow || dataRow.length === 0) {
            setEndOfData(true);
            return []
        }
        const usersDataPromises = dataRow.map(async (entry, index) => {
            if (!entry.c[0] || !entry.c[2] || !entry.c[3]) {
                setNullDataOffset(prevNullDataOffset => prevNullDataOffset + 1);
                return null;
            }
            const email = entry.c[2].v as string;
            const fetchUser = await getUserByEmail(email);
            const userData = fetchUser?.userData;
            const userUID = fetchUser?.userUID;
            const profileURL = userData?.photoURL;
            const rankChange = userData?.rankChange;
            return {
                name: `${entry.c[0].v} ${entry.c[1].v || ""}`,
                email: email,
                points: +entry.c[3].f,
                pointsRank: index + offset + 1,
                photoURL: profileURL,
                rankChange: rankChange as RankChange,
                uid: userUID
            };
        });

        const usersData = await Promise.all(usersDataPromises);
        return usersData.filter(user => user !== null) as PublicUserInfo[];
    }

    const queryAndSetRanks = async (limit: number, offset: number) => {
        const query = `select A, B, C, D LIMIT ${limit} OFFSET ${offset}`;
        queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, query)
            .then(response => {
                setLoading(true);
                return prepPointSheet(response!, offset)
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
                queryAndSetRanks(100, 0);
            })
        }
        fetchData();
    }, [])

    const renderRankChangeIcon = () => {
        switch (userRankChange) {
            case "increased":
                return <Octicons name="chevron-up" size={24} color="#AEF359" />;
            case "decreased":
                return <Octicons name="chevron-down" size={24} color="#FF0000" />;
            default:
                return <Octicons name="dash" size={22} color="gray" />
        }
    };


    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent)) return;
        if (endOfData) return;

        setLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            const offset = rankCards.length;
            queryAndSetRanks(50, offset + nullDataOffset);
            debounceTimer.current = null;
        }, 300);
    }, [rankCards, nullDataOffset, endOfData]);

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
                            <Text className='text-center text-xl font-bold text-white '>{rankCards[1]?.name}</Text>
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
                            <Text className='text-center text-xl font-bold text-white'>{rankCards[0]?.name}</Text>
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
                            <Text className='text-center text-xl font-bold text-white'>{rankCards[2]?.name}</Text>
                        </View>
                    </View>

                </View>

                <View className={`bg-[#F9F9F9] rounded-t-2xl flex-1 ${rankCards.length === 0 && "h-screen"}`}>
                    {/* User Ranking */}
                    {!initLoading && (
                        <View>
                            {userRank === -1 ? (
                                <View className='flex-col h-20 mx-4 px-4 mt-8 rounded-xl items-center justify-center'
                                    style={{ backgroundColor: colorMapping[userRankChange] }}>
                                    <Text className='text-xl font-medium'>You are unranked</Text>
                                </View>
                            ) : (
                                <View className='flex-row h-20 mx-4 px-4 mt-8 rounded-xl items-center'
                                    style={{ backgroundColor: colorMapping[userRankChange] }}>

                                    {userPoints != -1 ? (
                                        <View className='flex-row'>
                                            <View className='flex-1 flex-row items-center'>
                                                <View className='w-[65%] '>
                                                    <Text className='text-xl font-medium'>Your Ranking</Text>
                                                    <View className='flex-row items-center'>
                                                        <Text className='text-xl font-medium'>{userPoints} pts </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View className='flex-row'>
                                                <Text className='text-xl font-medium mr-4'>{userRank}</Text>
                                                <View className='bg-white h-7 w-7 rounded-full items-center justify-center'>
                                                    {renderRankChangeIcon()}
                                                </View>
                                            </View>
                                        </View>
                                    ) : (<Text className='text-xl font-medium'>You don't any have points.</Text>)}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Leaderboard */}
                    {rankCards.slice(3).map((userData, index) => (
                        <RankCard key={index + 3} userData={userData} navigation={navigation} />
                    ))}
                    <View className={`justify-center h-20 items-center ${rankCards.length === 0 && "h-[50%]"}`}>
                        {loading && (
                            <ActivityIndicator size={"large"} />
                        )}
                        {endOfData && (
                            <View className='pb-6 items-center justify-center'>
                                <Text>
                                    End of Leaderboard
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
    "same": "#7F7F7F",
    "decreased": "#B22222"
};

export default PointsLeaderboard