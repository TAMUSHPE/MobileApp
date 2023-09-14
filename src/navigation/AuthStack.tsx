import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileSetupStack } from "./ProfileSetupStack";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import { AuthStackParams } from '../types/Navigation';

const AuthStack = () => {
    const Stack = createNativeStackNavigator<AuthStackParams>();

    return (
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
    );
};

export { AuthStack };
