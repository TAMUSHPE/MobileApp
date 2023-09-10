import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Events from "../screens/Events";
import { EventsStackParams } from '../types/Navigation';
import CreateEvent from "../screens/CreateEvent";

const EventsStack = () => {
    const Stack = createNativeStackNavigator<EventsStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="EventsScreen" component={Events} />
            <Stack.Screen name="CreateEvent" component={CreateEvent} />
        </Stack.Navigator>
    );
};

export { EventsStack };
