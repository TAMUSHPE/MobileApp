import { ScrollView, Text, TouchableOpacity, Image, View, Dimensions } from 'react-native';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getPublicUserData, getMemberOfTheMonth } from '../../api/firebaseUtils';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { PublicUserInfo } from '../../types/User';
import { HomeStackParams } from "../../types/Navigation"
import { Images } from '../../../assets';
import FeaturedSlider from '../../components/FeaturedSlider';
import OfficeSignIn from './OfficeSignIn';

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const HomeScreen = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const { userInfo, setUserInfo, signOutUser } = useContext(UserContext)!;
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
            <View className='flex-row justify-center mt-4'>
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
            {userInfo?.publicInfo?.roles?.officer?.valueOf() && <OfficeSignIn />}

            <View className='my-10 py-6 mx-7 justify-center items-center rounded-md'>
            </View>
        </ScrollView>
    );
}

export default HomeScreen;