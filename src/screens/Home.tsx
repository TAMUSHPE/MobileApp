import { ScrollView, View } from 'react-native';
import React, { useContext } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';
import HomeBanner from '../components/HomeBanner';
import { UserContext } from '../context/UserContext';
const HomeScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }
    const { userInfo, setUserInfo } = userContext;

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <HomeBanner />
            <HighlightSlider />
            <OfficeHours />
        </ScrollView>
    );
}

export default HomeScreen;
