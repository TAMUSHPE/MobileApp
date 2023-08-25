import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen, SearchSettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutScreen } from "../screens/Settings";
import { SettingsStackParams } from '../types/Navigation';
import { UserContext } from "../context/UserContext";

const SettingsStack = () => {
    const Stack = createNativeStackNavigator<SettingsStackParams>();
    const { userInfo } = useContext(UserContext) ?? {};
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: darkMode ? "#2a2a2a" : "#FFF",
                },
                headerTintColor: darkMode ? "#F2F2F2" : "#000",
            }}
        >
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: "Settings" }} />
            <Stack.Screen name="SearchSettingsScreen" component={SearchSettingsScreen} options={{ title: "Search Settings" }} />
            <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} options={{ title: "Profile Settings" }} />
            <Stack.Screen name="DisplaySettingsScreen" component={DisplaySettingsScreen} options={{ title: "Display Settings" }} />
            <Stack.Screen name="AccountSettingsScreen" component={AccountSettingsScreen} options={{ title: "Account Settings/Info" }} />
            <Stack.Screen name="AboutScreen" component={AboutScreen} options={{ title: "About" }} />
        </Stack.Navigator>
    );
};

export { SettingsStack };
