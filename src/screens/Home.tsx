import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
import manageNotificationPermissions from '../helpers/pushNotification';
import { UserContext } from '../context/UserContext';
import HighlightSlider from '../components/HighlightSlider';
import OfficeHours from '../components/OfficeHours';
import OfficeSignIn from '../components/OfficeSignIn';
import { User, PublicUserInfoUID } from '../types/User';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from "../types/Navigation"
import { getPublicUserData, getMemberOfTheMonth } from '../api/firebaseUtils';
import { useFocusEffect } from '@react-navigation/core';
import { Images } from '../../assets';

/**
 * Renders the home screen of the application.
 * It includes the highlight slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const HomeScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);
    const { setUserInfo } = useContext(UserContext)!;
    const [MemberOfTheMonth, setLocalMemberOfTheMonth] = useState<PublicUserInfoUID | null>(null);

    const styles = StyleSheet.create({
        container: {
          flexDirection: 'row', // Arrange the columns horizontally
        },
        column: {
            alignItems: 'center',
            flex: 1, // Make each column take up an equal amount of space (50%)
            padding: 10,
            margin: 10,
        },
        text: {
            fontWeight: 'bold',
        },
    });

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
                        const loadedMemberOfTheMonth = await getMemberOfTheMonth();
                        if (loadedMemberOfTheMonth?.uid) {
                            await getLocalMemberOfTheMonthUser(loadedMemberOfTheMonth.uid);
                        }
                        console.log("loadedMemberOfTheMonth", loadedMemberOfTheMonth);
                    };
                    setLocalMemberOfTheMonth(null);
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
                className=''
                onPress={() => navigation.navigate("GoogleCalendar")}
            >
                    <Text className='font-bold'>General Meeting</Text>
            </TouchableOpacity>
            <HighlightSlider />
            <OfficeHours />
            {localUser?.publicInfo?.roles?.officer?.valueOf() && <OfficeSignIn />}
            
            <View className='my-10 py-6 mx-7 justify-center items-center rounded-md'>
            </View>


            <View style={styles.container}>
                <View style={styles.column} className='bg-gray-100 rounded-md'>
                    <Text style={styles.text} className='text-2xl text-pale-blue font-bold'>Upcoming Events</Text>
                    <Text>TODO: This is the content of column 1.</Text>
                </View>
                <View style={styles.column}>
                    <Text style={styles.text} className='text-2xl text-pale-blue font-bold'> Member of the Month </Text>
                    <TouchableOpacity 
                        onPress = {() => navigation.navigate("PublicProfile", {uid: MemberOfTheMonth?.uid!})}
                    > 
                        <Image source={MemberOfTheMonth?.photoURL ? { uri: MemberOfTheMonth?.photoURL } : Images.DEFAULT_USER_PICTURE} className='rounded-lg w-24 h-24' />
                    </TouchableOpacity>
                    <Text className='font-bold'> {MemberOfTheMonth?.name} </Text>
                </View>
            </View>
        </ScrollView>
    );
}

export default HomeScreen;