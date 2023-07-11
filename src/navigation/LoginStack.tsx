import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginStackNavigatorParamList } from '../types/Navigation';

// Screens  
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";

const LoginStackNavigator = () => {
    const LoginStack = createNativeStackNavigator<LoginStackNavigatorParamList>();
    return (
        <LoginStack.Navigator>
            <LoginStack.Screen name="Login" component={LoginScreen} />
            <LoginStack.Screen name="Register" component={RegisterScreen} />
        </LoginStack.Navigator>
    );
}

export { LoginStackNavigator };