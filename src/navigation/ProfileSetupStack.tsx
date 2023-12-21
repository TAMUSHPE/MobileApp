import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees, SetupResume } from "../screens/onboarding/ProfileSetup";
import { ProfileSetupStackParams } from "../types/Navigation";

type ProfileSetupStackProps = {
    navigateToLogin: () => void;
};

const ProfileSetupStack = ({ navigateToLogin }: ProfileSetupStackProps) => {
    const Stack = createStackNavigator<ProfileSetupStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SetupNameAndBio" options={{ gestureEnabled: false }}>
                {props => <SetupNameAndBio {...props} navigateToLogin={navigateToLogin} />}
            </Stack.Screen>
            <Stack.Screen name="SetupProfilePicture" component={SetupProfilePicture} />
            <Stack.Screen name="SetupAcademicInformation" component={SetupAcademicInformation} />
            <Stack.Screen name="SetupCommittees" component={SetupCommittees} />
            <Stack.Screen name="SetupResume" component={SetupResume} />
        </Stack.Navigator>
    );
};

export { ProfileSetupStack };
