import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PublicProfileScreen from "../screens/PublicProfile";
import { AboutSettingsScreen, AccountSettingsScreen, DisplaySettingsScreen, FAQSettingsScreen, FeedBackSettingsScreen, ProfileSettingsScreen, SettingsScreen } from "../screens/home/Settings";
import { UserContext } from "../context/UserContext";
import { PublicProfileStackParams } from "../types/navigation";
import { auth } from "../config/firebaseConfig";
import PersonalEventLog from "../screens/events/PersonalEventLog";

const PublicProfileStack = () => {
    const Stack = createNativeStackNavigator<PublicProfileStackParams>();
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} initialParams={{ uid: auth.currentUser?.uid }} />
            <Stack.Screen name="PersonalEventLogScreen" component={PersonalEventLog} />

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
        </Stack.Navigator>
    );
};

export { PublicProfileStack };
