import { View, Text, SafeAreaView, TouchableHighlight, ScrollView } from 'react-native'
import React from 'react'
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RankChange, ResourcesStackNavigatorParams } from '../types/Navigation';
import RankCard from '../components/RankCard';


const PointsLeaderboard = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackNavigatorParams> }) => {
    const rankCardSample = [{
        name: "Jason Le",
        points: 100,
        rank: 5,
        image: null,
        rankChange: "up" as RankChange
    }]
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

            <ScrollView bounces={false}>
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

                <View className='bg-white rounded-t-2xl flex-1 pb-20'>
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
                    <RankCard userData={rankCardSample[0]} navigation={navigation} />
                    <RankCard userData={rankCardSample[0]} navigation={navigation} />
                    <RankCard userData={rankCardSample[0]} navigation={navigation} />
                    <RankCard userData={rankCardSample[0]} navigation={navigation} />
                    <RankCard userData={rankCardSample[0]} navigation={navigation} />
                    <RankCard userData={rankCardSample[0]} navigation={navigation} />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default PointsLeaderboard