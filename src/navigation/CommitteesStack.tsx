import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommitteesScreen from "../screens/Committees";
import { CommitteesStackParams } from '../types/Navigation';

const CommitteesStack = () => {
    const Stack = createNativeStackNavigator<CommitteesStackParams>();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommitteesScreen" component={CommitteesScreen} />
        </Stack.Navigator>
    );
}

export { CommitteesStack }