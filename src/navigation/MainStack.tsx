import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeBottomTabs from "./HomeBottomTabs";
import AdminDashboard from "../screens/AdminDashboard";
import { MainStackParams } from '../types/Navigation';
import { SettingsStack } from "./SettingsStack";

const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Group
                screenOptions={{
                    headerShown: true
                }}
            >
                <Stack.Screen name="Settings" component={SettingsStack} />
            </Stack.Group>
        </Stack.Navigator>
    );
};

export { MainStack };
