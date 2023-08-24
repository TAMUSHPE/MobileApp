import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees } from "../screens/ProfileSetup";
import { ProfileSetupStackParams } from "../types/Navigation";

const ProfileSetupStack = () => {
    const Stack = createStackNavigator<ProfileSetupStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SetupNameAndBio" component={SetupNameAndBio} />
            <Stack.Screen name="SetupProfilePicture" component={SetupProfilePicture} />
            <Stack.Screen name="SetupAcademicInformation" component={SetupAcademicInformation} />
            <Stack.Screen name="SetupCommittees" component={SetupCommittees} />
        </Stack.Navigator>
    );
};

export { ProfileSetupStack };
