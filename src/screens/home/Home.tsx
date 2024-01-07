import { ScrollView } from 'react-native';
import React, { useEffect, useContext } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/Navigation"
import OfficeSignIn from './OfficeSignIn';
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
    const { userInfo, signOutUser } = useContext(UserContext)!;

    useEffect(() => {
        try {
            manageNotificationPermissions();
        } catch (error) {
            console.error("Error managing notification permissions:", error);
        }

        if (!auth.currentUser?.uid) {
            signOutUser(true);
        }
    }, []);

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <StatusBar style='dark' />
            <FlickrPhotoGallery />
            {userInfo?.publicInfo?.roles?.officer && <OfficeSignIn />}
            <Ishpe />

            {/* <FeaturedSlider route={route} /> */}

            <MOTMCard navigation={navigation} />


        </ScrollView>
    );
}

export default Home;