import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParams } from '../types/Navigation';

// Screens  
import HomeBottomTabs from "./HomeBottomTabs";
import SettingsScreen from "../screens/Settings";
import AdminDashboard from "../screens/AdminDashboard";

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
            <MainStack.Screen name="AdminDashboard" component={AdminDashboard} />
        </MainStack.Navigator>
    );
};

export { MainStackNavigator };
