import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserContext } from "../context/UserContext";
import { MainStackParams } from '../types/navigation';
import HomeBottomTabs from "./HomeBottomTabs";
import EventVerification from "../screens/events/EventVerification";
import QRCodeScanningScreen from "../screens/events/QRCodeScanningScreen";

const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();

    return (
        <Stack.Navigator initialRouteName="HomeBottomTabs">
            {/* Main components */}
            <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen name="HomeBottomTabs" component={HomeBottomTabs} />
            </Stack.Group>


            <Stack.Screen name="EventVerificationScreen" component={EventVerification} options={{ headerShown: false }} />
            <Stack.Screen name="QRCodeScanningScreen" component={QRCodeScanningScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export { MainStack };
