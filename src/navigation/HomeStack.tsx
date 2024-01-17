import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParams } from "../types/Navigation"
import PublicProfileScreen from "../screens/PublicProfile";
import Home from "../screens/home/Home"
import EventInfo from "../screens/events/EventInfo";

const HomeStack = () => {
    const Stack = createNativeStackNavigator<HomeStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
        </Stack.Navigator>
    );
};

export { HomeStack };