import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Events from "../screens/events/Events";
import { EventsStackParams } from '../types/Navigation';
import CreateEvent from "../screens/events/CreateEvent";
import UpdateEvent from "../screens/events/UpdateEvent";
import EventInfo from "../screens/events/EventInfo";
import QRCodeManager from "../screens/admin/QRCodeManager";
import SetGeneralEventDetails from "../screens/events/SetGeneralEventDetails";
import SetSpecificEventDetails from "../screens/events/SetSpecificEventDetails";
import FinalizeEvent from "../screens/events/FinalizeEvent";
import QRCodeScanningScreen from "../screens/events/QRCodeScanningScreen";

const EventsStack = () => {
    const Stack = createNativeStackNavigator<EventsStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="EventsScreen" component={Events} />
            <Stack.Screen name="UpdateEvent" component={UpdateEvent} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
            <Stack.Screen name="QRCode" component={QRCodeManager} />
            <Stack.Screen name="QRCodeScanningScreen" component={QRCodeScanningScreen} />

            {/* Event Creation Screens */}
            <Stack.Group>
                <Stack.Screen name="CreateEvent" component={CreateEvent} />
                <Stack.Screen name="SetGeneralEventDetails" component={SetGeneralEventDetails} />
                <Stack.Screen name="SetSpecificEventDetails" component={SetSpecificEventDetails} />
                <Stack.Screen name="FinalizeEvent" component={FinalizeEvent} />
            </Stack.Group>
        </Stack.Navigator>
    );
};

export { EventsStack };
