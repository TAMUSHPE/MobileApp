import { View, Text, TouchableHighlight } from 'react-native'
import React from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourcesStackParams } from '../types/Navigation';

const PointsInfo = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    return (
        <SafeAreaView className='bg-pale-orange h-full'>
            <View className='flex-row justify-end mr-6 mt-2'>
                <TouchableHighlight onPress={() => navigation.goBack()} underlayColor="#EF9260">
                    <Octicons name="x" size={30} color="black" />
                </TouchableHighlight >
            </View>
            <View className='mx-6'>
                <View>
                    <Text className='text-2xl font-bold'>What are MemberSHPE Points?</Text>
                    <Text className='text-xl mt-2 font-semibold'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus odit commodi odio necessitatibus! Praesentium quo, quam a dignissimos alias provident inventore ab asperiores exercitationem recusandae sed, sit id officiis nemo!</Text>
                </View>
                <View className='mt-4'>
                    <View>
                        <Text className='text-2xl font-bold'>How to earn points?</Text>
                        <Text className='text-xl mt-2 font-semibold'>+1 Upload Old Exam</Text>
                        <Text className='text-xl mt-2 font-semibold'>+2 Upload Old Exam w/ A</Text>
                        <Text className='text-xl mt-2 font-semibold'>+3 General Meeting & Events</Text>
                        <Text className='text-xl mt-2 font-semibold'>+1 Fitness Friday</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default PointsInfo