import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParamList, HomeStackNavigatorParamList, LoginStackNavigatorParamList, MembersStackNavigatorParamList } from '../types/Navigation';

// Screens  
import PublicProfileScreen from "../screens/PublicProfile";
import LoginScreen from "../screens/Login";
import RegisterScreen from "../screens/Register";
import HomeBottomTabs from "./BottomTabs";
import SettingsScreen from "../screens/Settings";
import MembersScreen from "../screens/Members";

const HomeStackNavigator = () => {
    const HomeStack = createNativeStackNavigator<HomeStackNavigatorParamList>();
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <HomeStack.Screen name="MemberOfTheMonth" component={PublicProfileScreen} />
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

const MembersStackNavigator = () => {
    const MembersStack = createNativeStackNavigator<MembersStackNavigatorParamList>();
    return (
        <MembersStack.Navigator>
            <MembersStack.Screen name="Members" component={MembersScreen} />
            <MembersStack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </MembersStack.Navigator>
    )
}


export { MainStackNavigator, HomeStackNavigator, MembersStackNavigator };
