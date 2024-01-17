import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileSetupStackParams } from "../types/Navigation";
import { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees, SetupResume, SetupInterests } from "../screens/onboarding/ProfileSetup";
import LoginScreen from "../screens/onboarding/Login";



const ProfileSetupStack = () => {
    const Stack = createStackNavigator<ProfileSetupStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SetupNameAndBio" options={{ gestureEnabled: false }} component={SetupNameAndBio} />
            <Stack.Screen name="SetupProfilePicture" component={SetupProfilePicture} />
            <Stack.Screen name="SetupAcademicInformation" component={SetupAcademicInformation} />
            <Stack.Screen name="SetupInterests" component={SetupInterests} />
            <Stack.Screen name="SetupCommittees" component={SetupCommittees} />
            <Stack.Screen name="SetupResume" component={SetupResume} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
        </Stack.Navigator>
    );
};

export { ProfileSetupStack };
