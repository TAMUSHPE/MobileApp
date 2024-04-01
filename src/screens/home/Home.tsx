import { ScrollView } from 'react-native';
import React, { useEffect, useContext } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from 'expo-status-bar';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/Navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import Ishpe from './Ishpe';
import { getUser } from '../../api/firebaseUtils';

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const Home = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const { userInfo, signOutUser, setUserInfo } = useContext(UserContext)!;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (auth.currentUser) {
                    const firebaseUser = await getUser(auth.currentUser?.uid!)
                    await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                    setUserInfo(firebaseUser);
                }
            } catch (error) {
                console.error("Error updating user1:", error);
            }
        }

        const handleBannedUser = async () => {
            const functions = getFunctions();
            const isUserInBlacklist = httpsCallable<{ uid: string }, { isInBlacklist: boolean }>(functions, 'isUserInBlacklist');
            try {
                const checkBlackListResponse = await isUserInBlacklist({ uid: auth.currentUser?.uid! });

                if (checkBlackListResponse.data.isInBlacklist) {
                    signOutUser(true);
                    alert("You have been banned from the app");
                    return;
                }
            } catch (error) {
                console.error('Error during user authentication:', error);
            }

        }


        fetchUser();
        handleBannedUser();
        manageNotificationPermissions();
    }, []);

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <StatusBar style='dark' />
            <FlickrPhotoGallery />
            <Ishpe navigation={navigation} />

            {/* <FeaturedSlider route={route} /> */}

            <MOTMCard navigation={navigation} />


        </ScrollView>
    );
}

export default Home;