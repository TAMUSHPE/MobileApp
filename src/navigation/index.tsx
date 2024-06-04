import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { Images } from '../../assets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setPrivateUserData } from '../api/firebaseUtils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../config/firebaseConfig';

/**
 * Renders the root navigator for the application.
 * It determines whether to show the authentication stack or main stack
 * based on the user's authentication status and profile setup.
 *
 * @returns  The rendered root navigator.
 */
const RootNavigator = () => {
    const { userInfo, setUserInfo, userLoading, signOutUser } = useContext(UserContext)!;

    /**
     * OLD IMPLEMENTATION - checkDataExpiration that is originally created to update a user data if it is expired
     * however user data is auto updated in home.tsx file. However this can still be used to check inactive users.
     */
    useEffect(() => {
        const checkDataExpiration = async () => {
            try {
                const now = new Date();

                // Use the existing userInfo state to check the expiration date
                const expirationDateData = userInfo?.private?.privateInfo?.expirationDate;

                let expirationDate;
                if (expirationDateData) {
                    try {
                        expirationDate = new Timestamp(expirationDateData.seconds, expirationDateData.nanoseconds).toDate();
                    } catch (error) {
                        console.error("Error parsing expiration date:", error);
                    }
                }

                if (!expirationDate || expirationDate < now) {
                    const newExpirationDate = new Date();
                    newExpirationDate.setDate(newExpirationDate.getDate() + 7);

                    const updatedPrivateData = {
                        ...userInfo?.private?.privateInfo,
                        expirationDate: Timestamp.fromDate(newExpirationDate),
                    };

                    await setPrivateUserData(updatedPrivateData);

                    // Update the local user data instead of re-fetching
                    const updatedUserInfo = {
                        ...userInfo,
                        private: {
                            ...userInfo?.private,
                            privateInfo: updatedPrivateData,
                        }
                    };

                    // Update AsyncStorage and state
                    await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                    setUserInfo(updatedUserInfo);
                }
            } catch (error) {
                console.error("Error in checkDataExpiration:", error);
            }
        };

        if (userInfo) {
            checkDataExpiration();
        }
    }, [userInfo]);


    useEffect(() => {
        const handleBannedUser = async () => {
            if (!auth.currentUser?.uid) {
                return;
            }

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

        handleBannedUser();
    }, [auth.currentUser?.uid])

    if (userLoading) {
        return <RenderUserLoading />;
    }

    const linking = {
        prefixes: ['tamu-shpe://'],
        config: {
            screens: {
                EventVerificationScreen: {
                    path: 'event/:id?:mode?',
                    parse: {
                        id: (id: string) => id,
                        mode: (mode: string) => mode
                    },
                },
            },
        },
    };

    return (
        // Temp fallback for loading screen
        <NavigationContainer linking={linking} fallback={<RenderUserLoading />}>
            {userInfo?.private?.privateInfo?.completedAccountSetup ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
    );
};


const RenderUserLoading = () => {
    return (
        <View className="flex items-center justify-center bg-dark-navy h-screen w-screen">
            <View className='mb-48'>
                <Image
                    source={Images.SHPE_LOGO}
                    className="h-36 w-36"
                />
            </View>
            <ActivityIndicator className='mt-4' size={"large"} />
        </View>
    );
};

export default RootNavigator;
