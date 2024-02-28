import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import Splash from '../screens/Splash';
import { Images } from '../../assets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, setPrivateUserData } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
/**
 * Renders the root navigator for the application.
 * It determines whether to show the splash screen, authentication stack, or main stack
 * based on the user's authentication status and profile setup.
 *
 * @returns  The rendered root navigator.
 */
const RootNavigator = () => {
    const { userInfo, setUserInfo, userLoading } = useContext(UserContext)!;
    const [splashLoading, setSplashLoading] = useState<boolean>(true);

    /**
     * OLD IMPLEMENTATION - checkDataExpiration that is originally created to update a user data if it is expired
     * however user data is auto updated in home.tsx file. However this can still be used to check inactive users.
     */
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


    useEffect(() => {
        const fetchUser = async () => {
            try {
                console.log("fetching user", auth.currentUser?.uid!);
                if (auth.currentUser) {
                    const firebaseUser = await getUser(auth.currentUser?.uid!)
                    console.log(firebaseUser?.publicInfo?.bio);
                    await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                    setUserInfo(firebaseUser);
                }
            } catch (error) {
                console.error("Error updating user1:", error);
            }
        }
        fetchUser();
    }, [auth.currentUser?.uid]);


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
