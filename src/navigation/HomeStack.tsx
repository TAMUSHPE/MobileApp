import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GoogleCalendar from "../screens/GoogleCalendar";
import Home from "../screens/Home"
import { HomeStackParams } from "../types/Navigation"

const HomeStack = () => {
    const Stack = createNativeStackNavigator<HomeStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="GoogleCalendar" component={GoogleCalendar} />
        </Stack.Navigator>
    );
};

export {HomeStack};