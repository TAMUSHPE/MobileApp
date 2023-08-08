import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParams } from '../types/Navigation';

// Screens  
import HomeBottomTabs from "./HomeBottomTabs";
import SettingsScreen from "../screens/Settings";

const MainStackNavigator = () => {
    const MainStack = createNativeStackNavigator<MainStackNavigatorParams>();
    return (
        <MainStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <MainStack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <MainStack.Screen name="SettingsScreen" component={SettingsScreen} />
        </MainStack.Navigator>
    );
};

export { MainStackNavigator };
