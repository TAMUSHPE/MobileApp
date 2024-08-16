import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Events from "../screens/events/Events";
import { EventsStackParams } from '../types/navigation';
import CreateEvent from "../screens/events/CreateEvent";
import UpdateEvent from "../screens/events/UpdateEvent";
import EventInfo from "../screens/events/EventInfo";
import QRCodeManager from "../screens/events/QRCodeManager";
import SetGeneralEventDetails from "../screens/events/SetGeneralEventDetails";
import SetSpecificEventDetails from "../screens/events/SetSpecificEventDetails";
import FinalizeEvent from "../screens/events/FinalizeEvent";
import SetLocationEventDetails from "../screens/events/SetLocationEventDetails";
import EventVerification from "../screens/events/EventVerification";
import PublicProfileScreen from "../screens/userProfile/PublicProfile";
import PastEvents from "../screens/events/PastEvents";
import Home from "../screens/home/Home";

const EventsStack = () => {
    const Stack = createNativeStackNavigator<EventsStackParams>();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="EventsScreen" component={Events} />
            <Stack.Screen name="PastEvents" component={PastEvents} />
            <Stack.Screen name="EventInfo" component={EventInfo} />
            <Stack.Screen name="UpdateEvent" component={UpdateEvent} />
            <Stack.Screen name="QRCode" component={QRCodeManager} />

            {/* Event Creation Screens */}
            <Stack.Group>
                <Stack.Screen name="CreateEvent" component={CreateEvent} />
                <Stack.Screen name="SetGeneralEventDetails" component={SetGeneralEventDetails} />
                <Stack.Screen name="SetSpecificEventDetails" component={SetSpecificEventDetails} />
                <Stack.Screen name="setLocationEventDetails" component={SetLocationEventDetails} />
                <Stack.Screen name="FinalizeEvent" component={FinalizeEvent} />
                <Stack.Screen name="EventVerificationScreen" component={EventVerification} />
            </Stack.Group>

            <Stack.Screen name="PublicProfile" component={PublicProfileScreen}></Stack.Screen>
            <Stack.Screen name="Home" component={Home}></Stack.Screen>

        </Stack.Navigator>
    );
};

export { EventsStack };
