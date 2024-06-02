import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommitteesStackParams } from '../types/navigation';
import CommitteeScreen from "../screens/Committees/Committee";
import PublicProfileScreen from "../screens/PublicProfile";
import CommitteeEditor from "../screens/admin/CommitteeEditor";
import EventInfo from "../screens/events/EventInfo";
import CommitteesScreen from "../screens/Committees/Committees";

const InvolvementStack = () => {
    const Stack = createNativeStackNavigator<CommitteesStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommitteesScreen" component={CommitteesScreen} />
            <Stack.Screen name="CommitteeScreen" component={CommitteeScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            <Stack.Screen name="CommitteeEditor" component={CommitteeEditor} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
        </Stack.Navigator>
    );
}

export { InvolvementStack }