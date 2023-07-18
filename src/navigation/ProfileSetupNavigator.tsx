import React from "react";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ProfileSetupNavigatorParamList } from "../types/Navigation";
import { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees } from "../screens/ProfileSetup";


const ProfileSetupNavigator = () => {
    const ProfileSetupTabs = createMaterialTopTabNavigator<ProfileSetupNavigatorParamList>();
    return (
        <ProfileSetupTabs.Navigator>
            <ProfileSetupTabs.Screen name="SetupNameAndBio" component={SetupNameAndBio} />
            <ProfileSetupTabs.Screen name="SetupProfilePicture" component={SetupProfilePicture} />
            <ProfileSetupTabs.Screen name="SetupAcademicInformation" component={SetupAcademicInformation} />
            <ProfileSetupTabs.Screen name="SetupCommittees" component={SetupCommittees} />
        </ProfileSetupTabs.Navigator>
    );
};

export { ProfileSetupNavigator };
