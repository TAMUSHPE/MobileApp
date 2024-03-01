import 'react-native-gesture-handler';
import React, { useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation';
import { auth } from './src/config/firebaseConfig';
import { getUser } from './src/api/firebaseUtils';
import { eventEmitter } from './src/context/eventEmitter';

export default function App() {
    useEffect(() => {
        const subscriber = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userFromFirebase = await getUser(user.uid);
                    await AsyncStorage.setItem("@user", JSON.stringify(userFromFirebase));
                    eventEmitter.emit("userUpdated");
                } catch (error) {
                    console.error("Error updating user:", error);
                }
            }
        });

        return () => subscriber();
    }, []);

    return (
        <SafeAreaProvider>
            <UserProvider>
                <RootNavigator />
            </UserProvider>
        </SafeAreaProvider>
    );
};
