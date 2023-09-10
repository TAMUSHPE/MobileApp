import React, { useEffect } from "react";
import { Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigationState } from '@react-navigation/native';
import { ProfileSetupStack } from "./ProfileSetupStack";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import { AuthStackParams } from '../types/Navigation';

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
                </Stack.Group>

                <Stack.Screen
                    name="RegisterScreen"
                    component={RegisterScreen}
                    options={{
                        title: 'Register Your Account',
                        headerStyle: {
                            backgroundColor: '#4957e6',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
            </Stack.Navigator>
        </>
    );
};

export { AuthStack };
