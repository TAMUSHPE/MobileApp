import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PublicProfileScreen from "../screens/userProfile/PublicProfile";
import { AboutSettingsScreen, AccountSettingsScreen, DisplaySettingsScreen, FAQSettingsScreen, FeedBackSettingsScreen, ProfileSettingsScreen, SettingsScreen } from "../screens/userProfile/Settings";
import { UserContext } from "../context/UserContext";
import { UserProfileStackParams } from "../types/navigation";
import { auth } from "../config/firebaseConfig";
import PersonalEventLog from "../screens/userProfile/PersonalEventLog";
import MemberSHPE from "../screens/home/MemberSHPE";
import UpdateEvent from "../screens/events/UpdateEvent";
import EventInfo from "../screens/events/EventInfo";
import QRCodeManager from "../screens/events/QRCodeManager";
import { useColorScheme } from "react-native";

const UserProfileStack = () => {
    const Stack = createNativeStackNavigator<UserProfileStackParams>();
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;


    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} initialParams={{ uid: auth.currentUser?.uid }} />
            <Stack.Screen name="PersonalEventLogScreen" component={PersonalEventLog} />
            <Stack.Screen name="MemberSHPE" component={MemberSHPE} />

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

            {/* Event Screens */}
            <Stack.Screen name="UpdateEvent" component={UpdateEvent} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
            <Stack.Screen name="QRCode" component={QRCodeManager} />
        </Stack.Navigator>
    );
};

export { UserProfileStack };
