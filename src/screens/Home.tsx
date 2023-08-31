import React, { useState, useEffect, useContext } from 'react';
import { ScrollView } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
import manageNotificationPermissions from '../helpers/pushNotification';
import { UserContext } from '../context/UserContext';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';
import OfficeSignIn from '../components/OfficeSignIn';
import { User } from '../types/User';
import { StatusBar } from 'expo-status-bar';

/**
 * Renders the home screen of the application.
 * It includes the highlight slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const HomeScreen = () => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);
    const { setUserInfo } = useContext(UserContext) ?? {};
    if (!setUserInfo) {
        return null;
    }

    useEffect(() => {
        // only for testing since manually change user in firebase need to look into this later
        // This will be remove when user settings and admin page is done
        const updateUser = async () => {
            try {
                const uid = auth.currentUser?.uid;
                if (uid) {
                    const userFromFirebase = await getUser(uid);
                    await AsyncStorage.setItem("@user", JSON.stringify(userFromFirebase));
                    setUserInfo(userFromFirebase);
                }
            } catch (error) {
                console.error("Error updating user:", error);
            }
        };

        const getLocalUser = async () => {
            try {
                const userJSON = await AsyncStorage.getItem("@user");
                const userData = userJSON ? JSON.parse(userJSON) : undefined;
                setLocalUser(userData);
            } catch (error) {
                console.error("Error retrieving user from AsyncStorage:", error);
            }
        };

        getLocalUser();

        try {
            manageNotificationPermissions();
        } catch (error) {
            console.error("Error managing notification permissions:", error);
        }
    }, []);

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <StatusBar style='dark' />
            <HighlightSlider />
            <OfficeHours />
            {localUser?.publicInfo?.roles?.officer?.valueOf() && <OfficeSignIn />}
        </ScrollView>
    );
}

export default HomeScreen;
