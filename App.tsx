import 'react-native-gesture-handler';
import React, { useEffect, useRef } from "react";
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation';
import { auth } from './src/config/firebaseConfig';
import { getUser } from './src/api/firebaseUtils';
import { eventEmitter } from './src/context/eventEmitter'; // Adjust the path as necessary

export default function App() {
    const notificationListener = useRef<Subscription | null>();
    const responseListener = useRef<Subscription | null>();
    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            Alert.alert(notification.request.content.body as string);
            if (notification.request.content.data.type === "approved" || notification.request.content.data.type === "denied" || notification.request.content.data.type === "removed") {
                const fetchUpdateMember = async () => {
                    try {
                        const uid = auth.currentUser?.uid;
                        if (uid) {
                            const userFromFirebase = await getUser(uid);
                            await AsyncStorage.setItem("@user", JSON.stringify(userFromFirebase));
                            eventEmitter.emit('userUpdated');
                        }
                    } catch (error) {
                        console.error("Error updating user:", error);
                    }
                }
                fetchUpdateMember();
            }
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            if (response.notification.request.content.data.type === "approved" || response.notification.request.content.data.type === "denied") {
                const fetchUpdateMember = async () => {
                    try {
                        const uid = auth.currentUser?.uid;
                        if (uid) {
                            const userFromFirebase = await getUser(uid);
                            await AsyncStorage.setItem("@user", JSON.stringify(userFromFirebase));
                            eventEmitter.emit('userUpdated');
                        }
                    } catch (error) {
                        console.error("Error updating user:", error);
                    }
                }
                fetchUpdateMember();
            }
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
        <SafeAreaProvider>
            <UserProvider>
                <RootNavigator />
            </UserProvider>
        </SafeAreaProvider>
    );
};

type Subscription = { remove: () => void };