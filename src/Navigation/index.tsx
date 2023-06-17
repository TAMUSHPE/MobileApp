import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import Drawer from './Drawer'
import MainStackNavigator from './MainStack';

const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Drawer />
            {/* <MainStackNavigator /> */}
        </NavigationContainer>
    );
};

export default RootNavigator;