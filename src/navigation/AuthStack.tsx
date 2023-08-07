import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackNavigatorParamList } from '../types/Navigation';
import { LoginStackNavigator } from "./LoginStack";
import { ProfileSetupStackNavigator } from "./ProfileSetupStack";

// Screens  

const AuthStackNavigator = () => {
    const AuthStack = createNativeStackNavigator<AuthStackNavigatorParamList>();
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <AuthStack.Screen name="LoginStack" component={LoginStackNavigator} />
            <AuthStack.Screen name="ProfileSetup" component={ProfileSetupStackNavigator} />
        </AuthStack.Navigator>
    );
};

export { AuthStackNavigator };
