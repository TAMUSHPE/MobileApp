import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParams } from "../types/navigation"
import PublicProfileScreen from "../screens/PublicProfile";
import Home from "../screens/home/Home"
import EventInfo from "../screens/events/EventInfo";
import AdminDashboard from "../screens/admin/AdminDashboard";
import MOTMEditor from "../screens/admin/MOTMEditor";
import ResumeDownloader from "../screens/admin/ResumeDownloader";
import LinkEditor from "../screens/admin/LinkEditor";
import RestrictionsEditor from "../screens/admin/RestrictionsEditor";
import MemberSHPEConfirm from "../screens/admin/MemberSHPEConfirm";
import ResumeConfirm from "../screens/admin/ResumeConfirm";
import ShirtConfirm from "../screens/admin/ShirtConfirm";
import CommitteeConfirm from "../screens/admin/CommitteeConfirm";
import FeedbackEditor from "../screens/admin/FeedbackEditor";
import InstagramPoints from "../screens/admin/InstagramPoints";
import UpdateEvent from "../screens/events/UpdateEvent";
import QRCodeManager from "../screens/events/QRCodeManager";
import MemberSHPE from "../screens/Committees/MemberSHPE";
import Members from "../screens/Members";

const HomeStack = () => {
    const Stack = createNativeStackNavigator<HomeStackParams>();
    return (
        <Stack.Navigator>

            <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="MemberSHPE" component={MemberSHPE} />
                <Stack.Screen name="Members" component={Members} />
            </Stack.Group>

            {/* Event Screens */}
            <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen name="UpdateEvent" component={UpdateEvent} />
                <Stack.Screen name="EventInfo" component={EventInfo} />
                <Stack.Screen name="QRCode" component={QRCodeManager} />
            </Stack.Group>

            {/* Admin Dashboard Screens */}
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
                <Stack.Screen name="FeedbackEditor" component={FeedbackEditor} />
                <Stack.Screen name="InstagramPoints" component={InstagramPoints} />
            </Stack.Group>

            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </Stack.Navigator>
    );
};

export { HomeStack };