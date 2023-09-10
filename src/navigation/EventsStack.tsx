import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Events from "../screens/Events";
import { EventsStackParams } from '../types/Navigation';
import CreateEvent from "../screens/CreateEvent";
import UpdateEvent from "../screens/UpdateEvent";
import SHPEEvent from "../screens/SHPEEvent";

const EventsStack = () => {
    const Stack = createNativeStackNavigator<EventsStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="EventsScreen" component={Events} />
            <Stack.Screen name="CreateEvent" component={CreateEvent} />
            <Stack.Screen name="UpdateEvent" component={UpdateEvent} />
            <Stack.Screen name="SHPEEvent" component={SHPEEvent} />
        </Stack.Navigator>
    );
};

export { EventsStack };
