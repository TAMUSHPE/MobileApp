import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParamList, HomeStackNavigatorParamList, LoginStackNavigatorParamList } from '../types/Navigation';

// Screens  
import PublicProfile from "../screens/PublicProfile";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import HomeBottomTabs from "./BottomTabs";
import SettingsScreen from "../screens/Settings";

const HomeStackNavigator = () => {
    const HomeStack = createNativeStackNavigator<HomeStackNavigatorParamList>();
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <HomeStack.Screen name="MemberOfTheMonth" component={PublicProfile} />
            <HomeStack.Screen name="Settings" component={SettingsScreen} />
        </HomeStack.Navigator>
    );
};

const LoginStackNavigator = () => {
    const LoginStack = createNativeStackNavigator<LoginStackNavigatorParamList>();
    return (
        <LoginStack.Navigator>
            <LoginStack.Screen name="Login" component={LoginScreen} />
            <LoginStack.Screen name="Register" component={RegisterScreen} />
        </LoginStack.Navigator>
    );
}

const MainStackNavigator = () => {
    const MainStack = createNativeStackNavigator<MainStackNavigatorParamList>();
    return (
        <MainStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <MainStack.Screen name="LoginStack" component={LoginStackNavigator} />
            <MainStack.Screen name="HomeStack" component={HomeStackNavigator} />
        </MainStack.Navigator>
    );
};


export { MainStackNavigator, HomeStackNavigator };
