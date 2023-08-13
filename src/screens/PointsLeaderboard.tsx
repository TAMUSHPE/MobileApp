import { View, Text, SafeAreaView, TouchableHighlight, ScrollView, ImageSourcePropType, NativeScrollEvent, NativeSyntheticEvent, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RankChange, ResourcesStackNavigatorParams } from '../types/Navigation';
import RankCard from '../components/RankCard';
import { queryGoogleSpreadsheet, GoogleSheetsIDs } from '../api/fetchGoogleSheets'
import { db } from '../config/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    const [loading, setLoading] = useState(false);

    const buildQuery = (limit: number, offset: number) => {
        return `select A, B, C, D LIMIT ${limit} OFFSET ${offset}`;
    }

    const getProfileUrlByEmail = async (email: string): Promise<string | null> => {
        const userRef = collection(db, 'users');
        const q = query(userRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userData = querySnapshot.docs[0].data();
        console.log(userData.photoURL)

        return userData.photoURL;
    }

    const prepUserData = async (data: any[], offset: number): Promise<userData[]> => {
        const usersDataPromises = data.map(async (entry, index) => {
            const email = entry.c[2].v;
            const profileURL = await getProfileUrlByEmail(email);
            return {
                name: `${entry.c[0].v} ${entry.c[1].v}`,
                email: email,
                points: entry.c[3].f,
                rank: offset + index + 4, // starts as Rank 4
                image: profileURL ? { uri: profileURL } : null,
                rankChange: 'same' as RankChange
            };
        });

        return await Promise.all(usersDataPromises);
    }

    useEffect(() => {
        const initialRankings = buildQuery(10, 3); // starts as Rank 4
        queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, initialRankings)
            .then(response => {
                setLoading(true);
                return prepUserData(response?.table.rows as any[], 0)
            }).then(data => {
                setRankCards(data);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [])

    const appendRankings = () => {
        setLoading(true);
        const offset = rankCards.length;
        const nextRankings = buildQuery(10, offset);
        queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID, nextRankings)
            .then(response => {
                return prepUserData(response?.table.rows as any[], offset)
            }).then(data => {
                setRankCards([...rankCards, ...data]);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }

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
                appendRankings();
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
                <View className='h-44 flex-row justify-between pt-5'>
                    <View className='bg-gray-400 justify-end rounded-full h-20 w-20 mt-9 ml-16'>
                        <Text className='text-2xl text-white text-center '>2</Text>
                    </View>
                    <View className='bg-yellow-300 justify-end  rounded-full h-20 w-20'>
                        <Text className='text-2xl text-white text-center'>1</Text>
                    </View>
                    <View className='bg-amber-800 justify-end rounded-full h-20 w-20 mt-9 mr-16'>
                        <Text className='text-2xl text-white text-center'>3</Text>
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
                            <View className='bg-white h-7 w-7 rounded-full items-center justify-center'>
                                {/* <Octicons name="chevron-down" size={24} color="#FF0000" /> */}
                                <Octicons name="chevron-up" size={24} color="#AEF359" />
                            </View>
                        </View>
                    </View>
                    {/* Leaderboard */}
                    {rankCards.map((userData, index) => (
                        <RankCard key={index} userData={userData} navigation={navigation} />
                    ))}
                    {loading && (
                        <ActivityIndicator className="mt-4" size={"large"} />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default PointsLeaderboard