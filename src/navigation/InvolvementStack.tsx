import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InvolvementScreen from "../screens/involvement/Involvement";
import { InvolvementStackParams } from '../types/Navigation';
import CommitteeScreen from "../screens/involvement/Committee";
import PublicProfileScreen from "../screens/PublicProfile";
// import CommitteeEditor from "../screens/CommitteeEditor";

const InvolvementStack = () => {
    const Stack = createNativeStackNavigator<InvolvementStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="InvolvementScreen" component={InvolvementScreen} />
            <Stack.Screen name="CommitteeScreen" component={CommitteeScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            {/* <Stack.Screen name="CommitteeEditor" component={CommitteeEditor} /> */}
        </Stack.Navigator>
    );
}

export { InvolvementStack }