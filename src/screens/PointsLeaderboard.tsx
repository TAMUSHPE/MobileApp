import { View, Text, SafeAreaView, TouchableHighlight, ScrollView, ImageSourcePropType, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RankChange, ResourcesStackNavigatorParams } from '../types/Navigation';
import RankCard from '../components/RankCard';
import { queryGoogleSpreadsheet, GoogleSheetsIDs } from '../api/fetchGoogleSheets'
import { getPhotoByEmail } from '../api/firebaseUtils'
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';

type userData = {
    name: string;
    points: number;
    rank: number;
    email: string;
    image: ImageSourcePropType | null;
    rankChange: RankChange;
}
const PointsLeaderboard = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackNavigatorParams> }) => {
    const [rankCards, setRankCards] = useState<userData[]>([])
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [loading, setLoading] = useState(true);



    const queryAndSetRanks = (limit: number, offset: number) => {
        const query = `select A, B, C, D LIMIT ${limit} OFFSET ${offset}`;
        queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, query)
            .then(response => {
                setLoading(true);
                return prepUserData(response?.table.rows as any[], offset)
            }).then(data => {
                setRankCards([...rankCards, ...data]);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            }).finally(() => {
                setLoading(false);
            })

    }



    const prepUserData = async (data: any[], offset: number): Promise<userData[]> => {
        const usersDataPromises = data.map(async (entry, index) => {
            const email = entry.c[2].v;
            const profileURL = await getPhotoByEmail(email);
            return {
                name: `${entry.c[0].v} ${entry.c[1].v}`,
                email: email,
                points: entry.c[3].f,
                rank: index + offset + 1,
                image: profileURL ? { uri: profileURL } : null,
                rankChange: 'same' as RankChange
            };
        });

        return await Promise.all(usersDataPromises);
    }


    useEffect(() => {
        queryAndSetRanks(13, 0);
    }, [])

    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(nativeEvent)) {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
                const offset = rankCards.length;
                queryAndSetRanks(13, offset);
                debounceTimer.current = null;
            }, 500);
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
                            onPress={() => { navigation.navigate("PublicProfile", { email: "jhernandez18@tamu.edu" }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rankCards[1]?.image || Images.DEFAULT_USER_PICTURE}
                                />
                            </View>
                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-gray-400 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>2</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='flex items-center justify-center mt-4 w-[92px]'>
                            <Text className='text-center text-xl font-bold'>{rankCards[1]?.name}</Text>
                        </View>
                    </View>

                    <View>
                        <TouchableOpacity
                            className='border-yellow-400 border-8 justify-end rounded-full h-[92px] w-[92px]'
                            onPress={() => { navigation.navigate("PublicProfile", { email: "jhernandez18@tamu.edu" }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rankCards[0]?.image || Images.DEFAULT_USER_PICTURE}
                                />
                            </View>

                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-yellow-400 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>1</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='flex items-center justify-center mt-4 w-[92px]'>
                            <Text className='text-center text-xl font-bold'>{rankCards[0]?.name}</Text>
                        </View>
                    </View>

                    <View>
                        <TouchableOpacity
                            className='border-amber-700 border-8 justify-end mt-9 rounded-full h-[92px] w-[92px]'
                            onPress={() => { navigation.navigate("PublicProfile", { email: "jhernandez18@tamu.edu" }) }}
                        >
                            <View className='justify-center items-center h-full'>
                                <Image
                                    className="w-20 h-20 rounded-full justify-center"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rankCards[2]?.image || Images.DEFAULT_USER_PICTURE}
                                />
                            </View>

                            <View className='absolute w-full items-center'>
                                <View className='w-8 h-8 bg-amber-700 items-center justify-center rounded-full translate-y-3'>
                                    <Text className='text-xl text-white'>3</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View className='flex items-center justify-center mt-4 w-[92px]'>
                            <Text className='text-center text-xl font-bold'>{rankCards[2]?.name}</Text>
                        </View>
                    </View>

                </View>




                <View className={`bg-white rounded-t-2xl flex-1 ${rankCards.length === 0 ? 'pb-96' : 'pb-20'}`}>
                    {/* User Ranking */}
                    <View className='flex-row bg-[#AEF359] h-14 mx-4 px-4 mt-8 rounded-xl items-center '>
                        <View className='flex-1'>
                            <Text className='text-xl font-medium'>Your Ranking</Text>
                        </View>
                        <View className='flex-row'>
                            <Text className='text-xl font-medium mr-4'>5</Text>
                            {/* <View className='bg-white h-7 w-7 rounded-full items-center justify-center'>
                                <Octicons name="chevron-down" size={24} color="#FF0000" />
                                <Octicons name="chevron-up" size={24} color="#AEF359" />
                            </View> */}
                        </View>
                    </View>
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