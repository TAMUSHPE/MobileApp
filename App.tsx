import "./global.css";
import "./src/nativewind-setup";
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from "react";
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';

export default function App() {
    const notificationListener = useRef<EventSubscription | null>(null);
    const responseListener = useRef<EventSubscription | null>(null);
    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            Alert.alert(notification.request.content.body as string);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);
    return (
        <SafeAreaProvider>
            <UserProvider>
                <RootNavigator />
            </UserProvider>
        </SafeAreaProvider>
    );
};
