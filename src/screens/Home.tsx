import { ScrollView } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';

const HomeScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    return (
        <ScrollView className="flex flex-col bg-white">
            <HighlightSlider />
            <OfficeHours />
        </ScrollView>
    );
}

export default HomeScreen;
