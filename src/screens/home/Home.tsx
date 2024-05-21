import { ScrollView, View } from 'react-native';
import React, { useEffect, useContext, useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/core';
import { StatusBar } from 'expo-status-bar';
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
    const { setUserInfo } = useContext(UserContext)!;

    const fetchUserData = async () => {
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    useEffect(() => {
        fetchUserData();
        manageNotificationPermissions();
    }, [])

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [])
    );

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <StatusBar style='dark' />
            <FlickrPhotoGallery />
            <Ishpe navigation={navigation} />

            {/* <FeaturedSlider route={route} /> */}

            <MOTMCard navigation={navigation} />

            <View className="mb-8" />
        </ScrollView>
    );
}

export default Home;