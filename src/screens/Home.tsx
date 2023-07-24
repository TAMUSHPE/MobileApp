import { ScrollView, View } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';
import HomeBanner from '../components/HomeBanner';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from '../types/User';
import OfficeSignIn from '../components/OfficeSignIn';

const HomeScreen = ({ route, navigation }: NativeStackScreenProps<HomeStackNavigatorParamList>) => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);

    useEffect(() => {
        const getLocalUser = async () => {
            try {
                const userJSON = await AsyncStorage.getItem("@user");
                const userData = userJSON ? JSON.parse(userJSON) : undefined;
                setLocalUser(userData);
            } catch (e) {
                console.error(e);
            }
        };
        getLocalUser();
    }, []);

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <HomeBanner />
            <HighlightSlider />
            <OfficeHours />

            {localUser?.publicInfo?.roles?.officer?.valueOf() && <OfficeSignIn />}
        </ScrollView>


    );
}

export default HomeScreen;
