import React, { useContext, useState } from 'react'
import { ActivityIndicator, View, Image } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { MainStackNavigator } from './MainStack';
import { UserContext } from '../context/UserContext';
import HomeBottomTabs from './HomeBottomTabs';
import { Images } from '../../assets';
import Splash from '../screens/Splash';

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
                    className="flex items-center justify-center bg-dark-navy h-screen w-screen"
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
            {userInfo?.private?.privateInfo?.completedAccountSetup ? <HomeBottomTabs /> : <MainStackNavigator />}
        </NavigationContainer>
    );
};

export default RootNavigator;
