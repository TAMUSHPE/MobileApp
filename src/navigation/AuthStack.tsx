import React, { useEffect } from "react";
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigationState } from '@react-navigation/native';
import { AuthStackParams } from '../types/Navigation';
import { ProfileSetupStack } from "./ProfileSetupStack";
import LoginScreen from "../screens/onboarding/Login";
import RegisterScreen from "../screens/onboarding/Register";
import LoginStudent from "../screens/onboarding/LoginStudent";
import LoginGuest from "../screens/onboarding/LoginGuest";
import GuestVerification from "../screens/onboarding/GuestVerification";
import GuestRecoveryAccount from "../screens/onboarding/GuestRecoveryAccount";

const AuthStackWarning = () => {
    const state = useNavigationState((state) => state);

    // Warn user that are not log in when scanning QR code for events
    useEffect(() => {
        if (!state) return;
        if (state.routes.some((route) => route.name === 'EventVerificationScreen')) {
            Alert.alert(
                'To join an event, you must be logged in as TAMU student',
                'You are not logged in. Please log in to continue.',
                [
                    { text: 'OK', onPress: () => console.log('OK Pressed') },
                ],
                { cancelable: false }
            );
        }
    }, [state]);

    return null;
};

const AuthStack = () => {
    const Stack = createNativeStackNavigator<AuthStackParams>();

    return (
        <>
            <AuthStackWarning />
            <Stack.Navigator>
                <Stack.Group screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="LoginScreen" component={LoginScreen} />
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupStack} />
                    <Stack.Screen name="LoginStudent" component={LoginStudent} />
                    <Stack.Screen name="LoginGuest" component={LoginGuest} />
                    <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
                    <Stack.Screen name="GuestVerification" component={GuestVerification} />
                    <Stack.Screen name="GuestRecoveryAccount" component={GuestRecoveryAccount} />
                </Stack.Group>

            </Stack.Navigator>
        </>
    );
};

export { AuthStack };
