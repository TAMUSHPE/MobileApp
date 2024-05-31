import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InvolvementStackParams } from '../types/navigation';
import InvolvementScreen from "../screens/involvement/Involvement";
import CommitteeScreen from "../screens/involvement/Committee";
import PublicProfileScreen from "../screens/PublicProfile";
import CommitteeEdit from "../screens/admin/CommitteeEdit";
import { EventsStack } from "./EventsStack";
import EventInfo from "../screens/events/EventInfo";

const InvolvementStack = () => {
    const Stack = createNativeStackNavigator<InvolvementStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="InvolvementScreen" component={InvolvementScreen} />
            <Stack.Screen name="CommitteeScreen" component={CommitteeScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            <Stack.Screen name="CommitteeEdit" component={CommitteeEdit} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
        </Stack.Navigator>
    );
}

export { InvolvementStack }