import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees, SetupResume } from "../screens/onboarding/ProfileSetup";
import { ProfileSetupStackParams } from "../types/Navigation";
import LoginScreen from "../screens/onboarding/Login";



const ProfileSetupStack = () => {
    const Stack = createStackNavigator<ProfileSetupStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SetupNameAndBio" options={{ gestureEnabled: false }} component={SetupNameAndBio} />
            <Stack.Screen name="SetupProfilePicture" component={SetupProfilePicture} />
            <Stack.Screen name="SetupAcademicInformation" component={SetupAcademicInformation} />
            <Stack.Screen name="SetupCommittees" component={SetupCommittees} />
            <Stack.Screen name="SetupResume" component={SetupResume} />
        </Stack.Navigator>
    );
};

export { ProfileSetupStack };
