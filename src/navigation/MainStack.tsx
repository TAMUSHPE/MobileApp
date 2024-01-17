import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserContext } from "../context/UserContext";
import { MainStackParams } from '../types/Navigation';
import HomeBottomTabs from "./HomeBottomTabs";
import AdminDashboardStack from "./AdminDashboardStack";
import EventVerification from "../screens/events/EventVerification";
import { SettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutSettingsScreen, FAQSettingsScreen, FeedBackSettingsScreen } from "../screens/home/Settings";
import PublicProfileScreen from "../screens/PublicProfile";
import QRCodeScanningScreen from "../screens/events/QRCodeScanningScreen";

const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();
    const { userInfo } = useContext(UserContext)!;
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
                <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} options={{ title: "Profile Settings" }} />
                <Stack.Screen name="DisplaySettingsScreen" component={DisplaySettingsScreen} options={{ title: "Display Settings" }} />
                <Stack.Screen name="FeedbackSettingsScreen" component={FeedBackSettingsScreen} options={{ title: "Feedback" }} />
                <Stack.Screen name="AccountSettingsScreen" component={AccountSettingsScreen} options={{ title: "Account Settings/Info" }} />
                <Stack.Screen name="AboutSettingsScreen" component={AboutSettingsScreen} options={{ title: "About" }} />
                <Stack.Screen name="FAQSettingsScreen" component={FAQSettingsScreen} options={{ title: "FAQ" }} />
            </Stack.Group>

            <Stack.Screen name="EventVerificationScreen" component={EventVerification} options={{ headerShown: false }} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QRCodeScanningScreen" component={QRCodeScanningScreen} options={{ headerShown: false }} />

        </Stack.Navigator>
    );
};

export { MainStack };
