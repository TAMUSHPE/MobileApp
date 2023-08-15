import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeBottomTabs from "./HomeBottomTabs";
import SettingsScreen from "../screens/Settings";
import AdminDashboard from "../screens/AdminDashboard";
import { MainStackParams } from '../types/Navigation';

const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        </Stack.Navigator>
    );
};

export { MainStack };
