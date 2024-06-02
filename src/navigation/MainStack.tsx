import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserContext } from "../context/UserContext";
import { MainStackParams } from '../types/navigation';
import HomeBottomTabs from "./HomeBottomTabs";
import EventVerification from "../screens/events/EventVerification";
import { SettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutSettingsScreen, FAQSettingsScreen, FeedBackSettingsScreen } from "../screens/home/Settings";
import PublicProfileScreen from "../screens/PublicProfile";
import QRCodeScanningScreen from "../screens/events/QRCodeScanningScreen";
import Members from "../screens/Members";

const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <Stack.Navigator initialRouteName="HomeBottomTabs">
            {/* Main components */}
            <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            </Stack.Group>


            <Stack.Screen name="EventVerificationScreen" component={EventVerification} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export { MainStack };
