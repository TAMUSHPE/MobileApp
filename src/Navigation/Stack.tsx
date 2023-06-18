import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList, TestStackNavigatorParamList } from './Navigation';

// Screens  
import Drawer from "./Drawer";
import Polling from "../screens/PublicProfile";

const HomeStack = createNativeStackNavigator<HomeStackNavigatorParamList>();
const HomeStackNavigator = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="Home_" component={Drawer} />
            <HomeStack.Screen name="PublicProfile" component={Polling} />
        </HomeStack.Navigator>
    );
};

const TestStack = createNativeStackNavigator<TestStackNavigatorParamList>();
const TestStackNavigator = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="PublicProfile" component={Polling} />
        </HomeStack.Navigator>
    );
};

export { HomeStackNavigator, TestStackNavigator };