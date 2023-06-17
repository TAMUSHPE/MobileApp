import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackNavigatorParamList } from './Navigation';

// Screens  
import Drawer from "./Drawer";
import Polling from "../screens/Polling";

const HomeStack = createNativeStackNavigator<HomeStackNavigatorParamList>();
const MainStackNavigator = () => {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeStack.Screen name="Home_" component={Drawer} />
            <HomeStack.Screen name="Polling" component={Polling} />
        </HomeStack.Navigator>
    );
};

export { MainStackNavigator };