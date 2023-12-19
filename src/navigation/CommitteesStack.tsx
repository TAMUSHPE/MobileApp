import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommitteesScreen from "../screens/Committees";
import { CommitteesStackParams } from '../types/Navigation';
import CommitteeInfoScreen from "../screens/CommitteeInfo";
import PublicProfileScreen from "../screens/PublicProfile";
import CommitteeEditor from "../screens/CommitteeEditor";

const CommitteesStack = () => {
    const Stack = createNativeStackNavigator<CommitteesStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommitteesScreen" component={CommitteesScreen} />
            <Stack.Screen name="CommitteeInfoScreen" component={CommitteeInfoScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            <Stack.Screen name="CommitteeEditor" component={CommitteeEditor} />
        </Stack.Navigator>
    );
}

export { CommitteesStack }