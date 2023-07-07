import { View, Text, TouchableOpacity, Button } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';

const HomeScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    return (
        <View className="flex flex-col justify-center items-center bg-white">
            <HighlightSlider />
            <OfficeHours />
        </View>
    );
}

export default HomeScreen;
