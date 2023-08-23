import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen, SearchSettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutScreen } from "../screens/Settings";
import { SettingsStackParams } from '../types/Navigation';

const SettingsStack = () => {
    const Stack = createNativeStackNavigator<SettingsStackParams>();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true
            }}
        >
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: "Settings" }} />
            <Stack.Screen name="SearchSettingsScreen" component={SearchSettingsScreen} options={{ title: "Search Settings" }} />
            <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} options={{ title: "Profile Settings" }} />
            <Stack.Screen name="DisplaySettingsScreen" component={DisplaySettingsScreen} options={{ title: "Display Settings" }} />
            <Stack.Screen name="AccountSettingsScreen" component={AccountSettingsScreen} options={{ title: "Account Settings" }} />
            <Stack.Screen name="AboutScreen" component={AboutScreen} options={{ title: "About" }} />
        </Stack.Navigator>
    );
};

export { SettingsStack };
