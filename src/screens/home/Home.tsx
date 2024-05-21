import { ScrollView, View } from 'react-native';
import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/Navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import Ishpe from './Ishpe';

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const Home = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {

    useEffect(() => {
        manageNotificationPermissions();
    }, []);

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