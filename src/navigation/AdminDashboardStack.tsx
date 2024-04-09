import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/Navigation';
import { HomeStack } from "./HomeStack";
import RestrictionsEditor from "../screens/admin/RestrictionsEditor";
import AdminDashboard from "../screens/admin/AdminDashboard";
import MemberOfTheMonthEditor from "../screens/admin/MemberOfTheMonthEditor";
import FeaturedSlideEditor from "../screens/admin/FeaturedSlideEditor";
import ResumeDownloader from "../screens/admin/ResumeDownloader";
import ResetOfficeHours from "../screens/admin/ResetOfficeHours";
import MemberSHPEConfirm from "../screens/admin/MemberSHPEConfirm";
import ResumeConfirm from "../screens/admin/ResumeConfirm";
import PublicProfileScreen from "../screens/PublicProfile";
import Feedback from "../screens/admin/Feedback";
import ShirtConfirm from "../screens/admin/ShirtConfirm";
import CommitteeConfirm from "../screens/admin/CommitteeConfirm";

const AdminDashboardStack = () => {
    const Stack = createNativeStackNavigator<AdminDashboardParams>();

    return (
        <Stack.Navigator>
            <Stack.Group screenOptions={{ headerShown: false }} >
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                <Stack.Screen name="MemberOfTheMonthEditor" component={MemberOfTheMonthEditor} />
                <Stack.Screen name="FeaturedSlideEditor" component={FeaturedSlideEditor} />
                <Stack.Screen name="ResumeDownloader" component={ResumeDownloader} />
                <Stack.Screen name="ResetOfficeHours" component={ResetOfficeHours} />
                <Stack.Screen name="RestrictionsEditor" component={RestrictionsEditor} />
                <Stack.Screen name="MemberSHPEConfirm" component={MemberSHPEConfirm} />
                <Stack.Screen name="ResumeConfirm" component={ResumeConfirm} />
                <Stack.Screen name="ShirtConfirm" component={ShirtConfirm} />
                <Stack.Screen name="CommitteeConfirm" component={CommitteeConfirm} />
                <Stack.Screen name="Home" component={HomeStack} />
                <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
                <Stack.Screen name="Feedback" component={Feedback} />
            </Stack.Group>
        </Stack.Navigator>
    );
}

export default AdminDashboardStack