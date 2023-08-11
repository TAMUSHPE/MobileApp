import React, { useContext, useState } from 'react'
import { ActivityIndicator, View, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { AuthStackNavigator } from './AuthStack';
import { UserContext } from '../context/UserContext';
import { Images } from '../../assets';
import Splash from '../screens/Splash';
import { MainStackNavigator } from './MainStack';

const RootNavigator = () => {
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }
    // Note: Change this to see if has completed profile setup
    const { userInfo, userLoading } = userContext;
    const [spashLoading, setSplashLoading] = useState<boolean>(true);
    if (spashLoading) {
        return <Splash setIsLoading={setSplashLoading} />
    } else {
        if (userLoading)
            return (
                <View
                    className="flex items-center justify-center bg-primary-bg-dark h-screen w-screen"
                >
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
            {userInfo?.private?.privateInfo?.completedAccountSetup ? <MainStackNavigator /> : <AuthStackNavigator />}
        </NavigationContainer>
    );
};

export default RootNavigator;
