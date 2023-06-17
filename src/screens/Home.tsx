import { View, Text, TouchableOpacity, Button } from 'react-native'
import React from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../Navigation/Navigation';


const Home = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    return (
        <View className="flex flex-1 flex-col justify-center items-center">
            <View className="flex-none mt-4">
                <Text className="text-4xl font-bold text-center">Home Screen</Text>
            </View>
            <View className="grow justify-center items-center mb-32"
            >
                <TouchableOpacity
                    className='flex justify-center items-center mt-4 p-6 rounded-md bg-[#500] '
                    onPress={() => {
                        navigation.navigate("Polling");
                    }}>
                    <Text className='font-bold text-white text-5xl'>Sample Poll</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default Home