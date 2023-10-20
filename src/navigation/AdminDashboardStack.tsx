import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/Navigation';
import CommitteesEditor from "../screens/CommitteesEditor";
import RestrictionsEditor from "../screens/RestrictionsEditor";
import AdminDashboard from "../screens/AdminDashboard";
import MemberOfTheMonthEditor from "../screens/MemberOfTheMonthEditor";
import FeaturedSlideEditor from "../screens/FeaturedSlideEditor";
import ResumeDownloader from "../screens/ResumeDownloader";
import ResetOfficeHours from "../screens/ResetOfficeHours";

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
                <Stack.Screen
                    name="MemberOfTheMonthEditor"
                    component={MemberOfTheMonthEditor}
                    options={{
                        title: 'Member of the Month Editor'
                    }}
                />
                <Stack.Screen name="CommitteesEditor" component={CommitteesEditor} />
                <Stack.Screen name="FeaturedSlideEditor" component={FeaturedSlideEditor} />
                <Stack.Screen name="ResumeDownloader" component={ResumeDownloader} />
                <Stack.Screen name="ResetOfficeHours" component={ResetOfficeHours} />
                <Stack.Screen name="RestrictionsEditor" component={RestrictionsEditor} />
            </Stack.Group>
        </Stack.Navigator >
    );
}

export default AdminDashboardStack