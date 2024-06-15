import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PublicProfileScreen from "../screens/userProfile/PublicProfile";
import { AboutSettingsScreen, AccountSettingsScreen, DisplaySettingsScreen, FAQSettingsScreen, FeedBackSettingsScreen, ProfileSettingsScreen, SettingsScreen } from "../screens/userProfile/Settings";
import { UserContext } from "../context/UserContext";
import { UserProfileStackParams } from "../types/navigation";
import { auth } from "../config/firebaseConfig";
import PersonalEventLog from "../screens/userProfile/PersonalEventLog";

const UserProfileStack = () => {
    const Stack = createNativeStackNavigator<UserProfileStackParams>();
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} initialParams={{ uid: auth.currentUser?.uid }} />
            <Stack.Screen name="PersonalEventLogScreen" component={PersonalEventLog} />

            <Stack.Group
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: darkMode ? "#2a2a2a" : "#FFF",
                    },
                    headerTintColor: darkMode ? "#F2F2F2" : "#000",
                }}
            >
                <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} options={{ title: "Profile Settings" }} />
            </Stack.Group>
        </Stack.Navigator >
    );
};

export { UserProfileStack };
