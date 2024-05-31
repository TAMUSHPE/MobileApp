import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/navigation';
import { HomeStack } from "./HomeStack";
import RestrictionsEditor from "../screens/admin/RestrictionsEditor";
import AdminDashboard from "../screens/admin/AdminDashboard";
import MOTMEditor from "../screens/admin/MOTMEditor";
import ResumeDownloader from "../screens/admin/ResumeDownloader";
import MemberSHPEConfirm from "../screens/admin/MemberSHPEConfirm";
import ResumeConfirm from "../screens/admin/ResumeConfirm";
import PublicProfileScreen from "../screens/PublicProfile";
import FeedbackEditor from "../screens/admin/FeedbackEditor";
import ShirtConfirm from "../screens/admin/ShirtConfirm";
import CommitteeConfirm from "../screens/admin/CommitteeConfirm";
import LinkEditor from "../screens/admin/LinkEditor";
import InstagramPoints from "../screens/admin/InstagramPoints";

const AdminDashboardStack = () => {
    const Stack = createNativeStackNavigator<AdminDashboardParams>();

    return (
        <Stack.Navigator>
            <Stack.Group screenOptions={{ headerShown: false }} >
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                <Stack.Screen name="MOTMEditor" component={MOTMEditor} />
                <Stack.Screen name="ResumeDownloader" component={ResumeDownloader} />
                <Stack.Screen name="LinkEditor" component={LinkEditor} />
                <Stack.Screen name="RestrictionsEditor" component={RestrictionsEditor} />
                <Stack.Screen name="MemberSHPEConfirm" component={MemberSHPEConfirm} />
                <Stack.Screen name="ResumeConfirm" component={ResumeConfirm} />
                <Stack.Screen name="ShirtConfirm" component={ShirtConfirm} />
                <Stack.Screen name="CommitteeConfirm" component={CommitteeConfirm} />
                <Stack.Screen name="Home" component={HomeStack} />
                <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
                <Stack.Screen name="FeedbackEditor" component={FeedbackEditor} />
                <Stack.Screen name="InstagramPoints" component={InstagramPoints} />
            </Stack.Group>
        </Stack.Navigator>
    );
}

export default AdminDashboardStack