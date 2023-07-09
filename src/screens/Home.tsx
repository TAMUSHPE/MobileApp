import { View, Text, TouchableOpacity, Button } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';
import HighlightSlider from '../components/HighlightSlider';

const HomeScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    return (
        <View className="flex flex-col justify-center items-center bg-white">

            <HighlightSlider />

            {/* </View> */}
            <View className="flex flex-1 flex-col justify-center items-center">
                <Text className="text-2xl font-bold text-black">Welcome to the</Text>
                <Text className="text-2xl font-bold text-black">SHPE</Text>
                <Text className="text-2xl font-bold text-black">Muslim Students' Association</Text>
            </View>
        </View>
    );
}

export default HomeScreen;
