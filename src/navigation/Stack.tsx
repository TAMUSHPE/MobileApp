import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParamList, HomeStackNavigatorParamList } from '../types/Navigation';

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

const MainStackNavigator = () => {
    const MainStack = createNativeStackNavigator<MainStackNavigatorParamList>();
    return (
        <MainStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <MainStack.Screen name="Login" component={LoginScreen} />
            <MainStack.Screen name="Register" component={RegisterScreen} />
            <MainStack.Screen name="Home" component={HomeStackNavigator} />
        </MainStack.Navigator>
    );
};


export { MainStackNavigator, HomeStackNavigator };
