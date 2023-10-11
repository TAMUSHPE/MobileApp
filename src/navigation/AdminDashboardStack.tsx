import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/Navigation';
import CommitteesEditor from "../screens/CommitteesEditor";
import AdminDashboard from "../screens/AdminDashboard";
import FeaturedSlideEditor from "../screens/FeaturedSlideEditor";

const AdminDashboardStack = () => {
    const Stack = createNativeStackNavigator<AdminDashboardParams>();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="CommitteesEditor" component={CommitteesEditor} />
            <Stack.Screen name="FeaturedSlideEditor" component={FeaturedSlideEditor} />
        </Stack.Navigator>
    );
}

export default AdminDashboardStack