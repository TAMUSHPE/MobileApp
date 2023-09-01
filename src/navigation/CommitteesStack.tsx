import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommitteesScreen from "../screens/Committees";
import { CommitteesStackParams } from '../types/Navigation';
import PublicProfileScreen from "../screens/PublicProfile";

const CommitteesStack = () => {
    const Stack = createNativeStackNavigator<CommitteesStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommitteesScreen" component={CommitteesScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
}

export { CommitteesStack }