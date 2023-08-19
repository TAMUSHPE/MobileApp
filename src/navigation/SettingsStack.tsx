import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from "../screens/Settings";
import { SettingsStackParams } from '../types/Navigation';

const SettingsStack = () => {
    const Stack = createNativeStackNavigator<SettingsStackParams>();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Group
                screenOptions={{
                    headerShown: true
                }}
            >
            </Stack.Group>
        </Stack.Navigator>
    );
};

export { SettingsStack };
