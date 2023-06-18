import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList, TestStackNavigatorParamList } from './Navigation';

// Screens  
import Drawer from "./Drawer";
import Polling from "../screens/PublicProfile";
import Home from "../screens/Home";

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
        <TestStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <TestStack.Screen name="PublicProfile" component={Polling} />
            <TestStack.Screen name="HomeTest" component={Home} />


        </TestStack.Navigator>
    );
};

export { HomeStackNavigator, TestStackNavigator };