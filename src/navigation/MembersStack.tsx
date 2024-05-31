import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PublicProfileScreen from "../screens/PublicProfile";
import MembersScreen from "../screens/Members";
import { MembersStackParams } from '../types/navigation';
import { ProfileSettingsScreen, SettingsScreen } from "../screens/Settings";

const MembersStack = () => {
    const Stack = createNativeStackNavigator<MembersStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MembersScreen" component={MembersScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
};

export { MembersStack };
