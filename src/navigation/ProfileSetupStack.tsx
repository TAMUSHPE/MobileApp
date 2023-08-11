import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileSetupStackNavigatorParams } from "../types/Navigation";
import { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees } from "../screens/ProfileSetup";


const ProfileSetupStackNavigator = () => {
    const ProfileSetupTabs = createStackNavigator<ProfileSetupStackNavigatorParams>();
    return (
        <ProfileSetupTabs.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <ProfileSetupTabs.Screen name="SetupNameAndBio" component={SetupNameAndBio} />
            <ProfileSetupTabs.Screen name="SetupProfilePicture" component={SetupProfilePicture} />
            <ProfileSetupTabs.Screen name="SetupAcademicInformation" component={SetupAcademicInformation} />
            <ProfileSetupTabs.Screen name="SetupCommittees" component={SetupCommittees} />
        </ProfileSetupTabs.Navigator>
    );
};

export { ProfileSetupStackNavigator };
