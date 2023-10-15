import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, View, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
import manageNotificationPermissions from '../helpers/pushNotification';
import { UserContext } from '../context/UserContext';
import FeaturedSlider from '../components/FeaturedSlider';
import OfficeHours from '../components/OfficeHours';
import OfficeSignIn from '../components/OfficeSignIn';
import { User, PublicUserInfo } from '../types/User';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from "../types/Navigation"
import { getPublicUserData, getMemberOfTheMonth } from '../api/firebaseUtils';
import { useFocusEffect } from '@react-navigation/core';
import { Images } from '../../assets';

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const HomeScreen = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);
    const { setUserInfo } = useContext(UserContext)!;
    const [MemberOfTheMonth, setLocalMemberOfTheMonth] = useState<PublicUserInfo | null>(null);

    const screenWidth = Dimensions.get('window').width;
    const imageHeight = screenWidth * 0.34;

    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                try {
                    const getLocalMemberOfTheMonthUser = async (uid: string) => {
                        const fetchedInfo = await getPublicUserData(uid);
                        if (fetchedInfo) {
                            setLocalMemberOfTheMonth({
                                ...fetchedInfo,
                                uid,
                            });
                        }
                    };

                    const loadData = async () => {
                        const { uid, name } = await getMemberOfTheMonth() || {};
                        if (uid) {
                            await getLocalMemberOfTheMonthUser(uid);
                        } else {
                            setLocalMemberOfTheMonth({ uid: "", name: name });
                        }
                    };
                    loadData();
                } catch (error) {
                    console.error('An error occurred while fetching events:', error);
                }
            };
            fetchEvents();
        }, [])
    );

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
            <TouchableOpacity
                className='bg-pale-orange justify-center items-center py-1'
                onPress={() => navigation.navigate("GoogleCalendar")}
            >
                <Text className='font-semibold'>General Meeting</Text>
            </TouchableOpacity>
            <FeaturedSlider route={route} />
            <View className='flex-row justify-center mt-4'>
                <View className='bg-gray-100 rounded-md items-center w-1/2 p-4'>
                    <Text className='text-2xl text-pale-blue font-bold pb-2 text-center'>Upcoming Events</Text>
                    <Text>TODO: This is the content of column 1.</Text>
                </View>
                {MemberOfTheMonth && (
                    <View className="items-center p-4 w-1/2">
                        <Text className='text-2xl text-pale-blue font-bold text-center'>Member of the Month </Text>
                        <View className='w-full items-center justify-center'>
                            <TouchableOpacity
                                disabled={MemberOfTheMonth.uid === ""}
                                onPress={() => navigation.navigate("PublicProfile", { uid: MemberOfTheMonth?.uid! })}
                                className='w-full p-4'
                            >
                                <Image
                                    style={{ height: imageHeight }}
                                    className='rounded-lg w-full'
                                    source={MemberOfTheMonth?.photoURL ? { uri: MemberOfTheMonth?.photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            </TouchableOpacity>
                            <Text className='font-bold'>{MemberOfTheMonth?.name}</Text>
                        </View>
                    </View>
                )}
            </View>
            <OfficeHours />
            {localUser?.publicInfo?.roles?.officer?.valueOf() && <OfficeSignIn />}

            <View className='my-10 py-6 mx-7 justify-center items-center rounded-md'>
            </View>
        </ScrollView>
    );
}

export default HomeScreen;