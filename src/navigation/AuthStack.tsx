import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackNavigatorParamList } from '../types/Navigation';
import { ProfileSetupStackNavigator } from "./ProfileSetupStack";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";


const AuthStackNavigator = () => {
    const AuthStack = createNativeStackNavigator<AuthStackNavigatorParamList>();
    return (
        <AuthStack.Navigator>
            <AuthStack.Group
                screenOptions={{
                    headerShown: false,
                }}
            >
                <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
                <AuthStack.Screen name="ProfileSetup" component={ProfileSetupStackNavigator} />
            </AuthStack.Group>
            <AuthStack.Screen
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
        </AuthStack.Navigator>
    );
};

export { AuthStackNavigator };
