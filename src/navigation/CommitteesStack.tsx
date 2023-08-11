import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommitteesStackNavigatorParams } from '../types/Navigation';

import CommitteesScreen from "../screens/Committees";

const CommitteesStackNavigator = () => {
    const CommitteesStack = createNativeStackNavigator<CommitteesStackNavigatorParams>();
    return (
        <CommitteesStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <CommitteesStack.Screen name="CommitteesScreen" component={CommitteesScreen} />
        </CommitteesStack.Navigator>
    );
}

export { CommitteesStackNavigator }