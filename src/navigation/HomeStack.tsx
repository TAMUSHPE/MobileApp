import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from '../types/Navigation';

// Screens  
import HomeBottomTabs from "./HomeBottomTabs";
import SettingsScreen from "../screens/Settings";

const HomeStackNavigator = () => {
    const HomeStack = createNativeStackNavigator<HomeStackNavigatorParamList>();
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <HomeStack.Screen name="SettingsScreen" component={SettingsScreen} />
        </HomeStack.Navigator>
    );
};

export { HomeStackNavigator };
