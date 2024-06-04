import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommitteesStackParams } from '../types/navigation';
import CommitteeScreen from "../screens/committees/Committee";
import PublicProfileScreen from "../screens/UserProfile/PublicProfile";
import CommitteeEditor from "../screens/committees/CommitteeEditor";
import EventInfo from "../screens/events/EventInfo";
import CommitteesScreen from "../screens/committees/Committees";
import UpdateEvent from "../screens/events/UpdateEvent";
import QRCodeManager from "../screens/events/QRCodeManager";

const CommitteesStack = () => {
    const Stack = createNativeStackNavigator<CommitteesStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommitteesScreen" component={CommitteesScreen} />
            <Stack.Screen name="CommitteeScreen" component={CommitteeScreen} />
            <Stack.Screen name="CommitteeEditor" component={CommitteeEditor} />


            {/* Event Screens */}
            <Stack.Screen name="UpdateEvent" component={UpdateEvent} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
            <Stack.Screen name="QRCode" component={QRCodeManager} />

            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
}

export { CommitteesStack }