import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParamList, HomeStackNavigatorParamList } from '../types/Navigation';

// Screens  
import HomeDrawer from "./Drawer";
import PublicProfile from "../screens/PublicProfile";
import LoginScreen from "../screens/Login";
import HomeScreen from "../screens/Home";
import RegisterScreen from "../screens/Register";
import HomeBottomTabs from "./BottomTabs";

const HomeStackNavigator = () => {
    const HomeStack = createNativeStackNavigator<HomeStackNavigatorParamList>();
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            <HomeStack.Screen name="PublicProfile" component={PublicProfile} />
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
