import React, { useContext, useState } from 'react';
import { ActivityIndicator, View, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import Splash from '../screens/Splash';
import { Images } from '../../assets';

/**
 * Renders the root navigator for the application.
 * It determines whether to show the splash screen, authentication stack, or main stack
 * based on the user's authentication status and profile setup.
 *
 * @returns  The rendered root navigator.
 */
const RootNavigator = () => {
    const userContext = useContext(UserContext);
    const { userInfo, userLoading } = userContext ?? {};

    const [splashLoading, setSplashLoading] = useState<boolean>(true);
    if (splashLoading) {
        return <Splash setIsLoading={setSplashLoading} />
    } else {
        if (userLoading)
            return (
                <View className="flex items-center justify-center bg-dark-navy h-screen w-screen">
                    <Image
                        source={Images.SHPE_LOGO}
                        className="h-48 w-48"
                    />
                    <ActivityIndicator className='mt-4' size={"large"} />
                </View>
            );
    }

    return (
        <NavigationContainer>
            {userInfo?.private?.privateInfo?.completedAccountSetup ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
    );
};

export default RootNavigator;
