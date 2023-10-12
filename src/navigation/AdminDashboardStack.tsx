import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/Navigation';
import CommitteesEditor from "../screens/CommitteesEditor";
import AdminDashboard from "../screens/AdminDashboard";
import MemberOfTheMonthEditor from "../screens/MemberOfTheMonthEditor";
import { TouchableOpacity } from "react-native";
import { Octicons } from '@expo/vector-icons';

const AdminDashboardStack = () => {
    const Stack = createNativeStackNavigator<AdminDashboardParams>();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Admin Screens*/}
            <Stack.Group
                screenOptions={{
                    headerShown: true
                }}
            >
                <Stack.Screen 
                    name="AdminDashboard" 
                    component={AdminDashboard}
                />
                <Stack.Screen name="CommitteesEditor" component={CommitteesEditor} />
                <Stack.Screen 
                    name="MemberOfTheMonthEditor" 
                    component={MemberOfTheMonthEditor} 
                    options={{
                        title: 'Member of the Month Editor'
                    }}
                />
            </Stack.Group>
        </Stack.Navigator>
    );
}

export default AdminDashboardStack