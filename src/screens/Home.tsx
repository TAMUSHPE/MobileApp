import { View, Text, TouchableOpacity, Button } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';

const HomeScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    return (
        <View className="flex flex-1 flex-col justify-center items-center">
            <View className="flex-none mt-4">
                <Text className="text-4xl font-bold text-center">Home Screen</Text>
            </View>
            <View className="grow justify-center items-center mb-32"
            >
                <TouchableOpacity
                    className='flex justify-center items-center mt-4 p-6 rounded-md bg-[#500]'
                    onPress={() => {
                        navigation.navigate("PublicProfile");
                    }}>
                    <Text className='font-bold text-white text-5xl'>Member of the Month</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default HomeScreen;
