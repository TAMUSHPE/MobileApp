import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackNavigatorParamList } from '../types/Navigation';
import { LoginStackNavigator } from "./LoginStack";
import { HomeStackNavigator } from "./HomeStack";
import { ProfileSetupNavigator } from "./ProfileSetupNavigator";

// Screens  

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
            <MainStack.Screen name="ProfileSetup" component={ProfileSetupNavigator} />
        </MainStack.Navigator>
    );
};

export { MainStackNavigator };
