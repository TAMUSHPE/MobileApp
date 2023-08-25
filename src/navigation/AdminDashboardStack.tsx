import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/Navigation';
import CommitteesEditor from "../screens/CommitteesEditor";
import AdminDashboard from "../screens/AdminDashboard";

const AdminDashboardStack = () => {
    const Stack = createNativeStackNavigator<AdminDashboardParams>();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="CommitteesEditor" component={CommitteesEditor} />
        </Stack.Navigator>
    );
}

export default AdminDashboardStack