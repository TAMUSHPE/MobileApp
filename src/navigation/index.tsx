import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Image, Text } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import Splash from '../screens/Splash';
import { Images } from '../../assets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventEmitter } from '../context/eventEmitter';
import { setPrivateUserData } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
/**
 * Renders the root navigator for the application.
 * It determines whether to show the splash screen, authentication stack, or main stack
 * based on the user's authentication status and profile setup.
 *
 * @returns  The rendered root navigator.
 */
const RootNavigator = () => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo, userLoading } = userContext!;
    const [splashLoading, setSplashLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkDataExpiration = async () => {
            const now = new Date();

            // Use the existing userInfo state to check the expiration date
            const expirationDateString = userInfo?.private?.privateInfo?.expirationDate;
            const expirationDate = expirationDateString ? new Date(expirationDateString) : undefined;

            if (!expirationDate || expirationDate < now) {
                const newExpirationDate = new Date();
                newExpirationDate.setDate(newExpirationDate.getDate() + 7);

                const updatedPrivateData = {
                    ...userInfo?.private?.privateInfo,
                    expirationDate: newExpirationDate,
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
        };

        if (userInfo) {
            checkDataExpiration();
        }
    }, [userInfo]);

    // fetch user data from async storage from notification
    // works with app.tsx file to update user data
    useEffect(() => {
        const handleUserUpdate = async () => {
            const userData = await AsyncStorage.getItem('@user');
            if (userData) {
                setUserInfo(JSON.parse(userData));
            }
        };

        eventEmitter.on('userUpdated', handleUserUpdate);
        return () => {
            eventEmitter.off('userUpdated', handleUserUpdate);
        };
    }, []);

    if (splashLoading) {
        return <Splash setIsLoading={setSplashLoading} />;
    }

    if (userLoading) {
        return <RenderUserLoading />;
    }

    const linking = {
        prefixes: ['tamu-shpe://'],
        config: {
            screens: {
                EventVerificationScreen: {
                    path: 'event/:id?',
                    parse: {
                        id: (id: string) => `${id}`,
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
            <Image
                source={Images.SHPE_LOGO}
                className="h-48 w-48"
            />
            <ActivityIndicator className='mt-4' size={"large"} />
        </View>
    );
};

export default RootNavigator;
