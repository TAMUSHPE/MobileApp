import { ScrollView } from 'react-native';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getMemberOfTheMonth } from '../../api/firebaseUtils';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { PublicUserInfo } from '../../types/User';
import { HomeStackParams } from "../../types/Navigation"
import OfficeSignIn from './OfficeSignIn';
import FeaturedSlider from '../../components/FeaturedSlider';
import MOTMCard from '../../components/MOTMCard';


/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const Home = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const { userInfo, signOutUser } = useContext(UserContext)!;
    const [memberOfTheMonth, setMemberOfTheMonth] = useState<PublicUserInfo>();


    const fetchMemberOfTheMonth = async () => {
        try {
            const fetchedMemberOfTheMonth = await getMemberOfTheMonth();
            setMemberOfTheMonth(fetchedMemberOfTheMonth);
        } catch (error) {
            console.error('Error fetching member of the month:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMemberOfTheMonth();
        }, [])
    );

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

            <FeaturedSlider route={route} />

            {userInfo?.publicInfo?.roles?.officer && <OfficeSignIn />}

            <MOTMCard userData={memberOfTheMonth} navigation={navigation} />
        </ScrollView>
    );
}

export default Home;