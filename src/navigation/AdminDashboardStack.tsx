import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardParams, MainStackParams } from '../types/Navigation';
import CommitteeCreator from "../screens/CommitteeCreator";
import RestrictionsEditor from "../screens/RestrictionsEditor";
import AdminDashboard from "../screens/AdminDashboard";
import MemberOfTheMonthEditor from "../screens/MemberOfTheMonthEditor";
import FeaturedSlideEditor from "../screens/FeaturedSlideEditor";
import ResumeDownloader from "../screens/ResumeDownloader";
import ResetOfficeHours from "../screens/ResetOfficeHours";
import { Button } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/core";
import MemberSHPEConfirm from "../screens/MemberSHPEConfirm";
import ResumeConfirm from "../screens/ResumeConfirm";
import LocationSample from "../screens/LocationSample";

const AdminDashboardStack = () => {
    const Stack = createNativeStackNavigator<AdminDashboardParams>();
    const navigation = useNavigation<NavigationProp<AdminDashboardParams>>();

    return (
        <Stack.Navigator>
            <Stack.Group
                screenOptions={{
                    headerShown: true,
                    headerLeft: () => (
                        <Button
                            title="Home"
                            onPress={() => navigation.navigate("HomeBottomTabs", { screen: 'Home' })}
                        />
                    )
                }}
            >
                <Stack.Screen
                    name="AdminDashboard"
                    component={AdminDashboard}
                />
            </Stack.Group>

            <Stack.Group
                screenOptions={{
                    headerShown: true
                }}
            >
                <Stack.Screen
                    name="MemberOfTheMonthEditor"
                    component={MemberOfTheMonthEditor}
                    options={{
                        title: 'Member of the Month Editor'
                    }}
                />
                <Stack.Screen name="CommitteeCreator" component={CommitteeCreator} />
                <Stack.Screen name="FeaturedSlideEditor" component={FeaturedSlideEditor} />
                <Stack.Screen name="ResumeDownloader" component={ResumeDownloader} />
                <Stack.Screen name="ResetOfficeHours" component={ResetOfficeHours} />
                <Stack.Screen name="RestrictionsEditor" component={RestrictionsEditor} />
                <Stack.Screen name="MemberSHPEConfirm" component={MemberSHPEConfirm} />
                <Stack.Screen name="ResumeConfirm" component={ResumeConfirm} />
                <Stack.Screen name="LocationSample" component={LocationSample} />

            </Stack.Group>
        </Stack.Navigator >
    );
}

export default AdminDashboardStack