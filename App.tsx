import 'react-native-gesture-handler';
import React, { useEffect, useRef } from "react";
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation';

export default function App() {
    const notificationListener = useRef<Subscription | null>();
    const responseListener = useRef<Subscription | null>();
    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            Alert.alert('A new FCM message arrived!', JSON.stringify(notification));
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    return (
        <UserProvider>
            <RootNavigator />
        </UserProvider>
    );
};

type Subscription = { remove: () => void };