import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginStackNavigatorParamList } from '../types/Navigation';

// Screens  
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import PushNotificationSetup from "../screens/PushNotificationSetup";

const LoginStackNavigator = () => {
    const LoginStack = createNativeStackNavigator<LoginStackNavigatorParamList>();
    return (
        <LoginStack.Navigator>
            <LoginStack.Group
                screenOptions={{
                    headerShown: false,
                }}
            >
                <LoginStack.Screen name="LoginScreen" component={LoginScreen} />
            </LoginStack.Group>
            <LoginStack.Screen
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
        </LoginStack.Navigator>
    );
};

export { LoginStackNavigator };
