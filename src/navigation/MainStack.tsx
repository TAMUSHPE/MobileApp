import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeBottomTabs from "./HomeBottomTabs";
import AdminDashboardStack from "./AdminDashboardStack";
import EventVerification from "../screens/EventVerification";
import { MainStackParams } from '../types/Navigation';
import { SettingsScreen, SearchSettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutSettingsScreen } from "../screens/Settings";
import { UserContext } from "../context/UserContext";

const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();
    const { userInfo } = useContext(UserContext) ?? {};
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <Stack.Navigator initialRouteName="HomeBottomTabs">
            {/* Main components */}
            <Stack.Group
                screenOptions={{
                    headerShown: false
                }}
            >
                <Stack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
                <Stack.Screen name="AdminDashboardStack" component={AdminDashboardStack} />
            </Stack.Group>

            {/* Settings Screens */}
            <Stack.Group
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
                <Stack.Screen name="AboutSettingsScreen" component={AboutSettingsScreen} options={{ title: "About" }} />
            </Stack.Group>

            <Stack.Screen name="EventVerificationScreen" component={EventVerification} options={{ headerShown: false }} />

        </Stack.Navigator>
    );
};

export { MainStack };
