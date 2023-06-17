import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainStackNavigatorParamList } from './types';

import Home from '../screens/Home';

import Settings from '../screens/Settings';
import Resources from '../screens/Resources';

const MainStack = createNativeStackNavigator<MainStackNavigatorParamList>();

const MainStackNavigator = () => {
    return (
        <MainStack.Navigator>
            <MainStack.Screen name="Home" component={Home} />
            <MainStack.Screen name="Resources" component={Resources} />
            <MainStack.Screen name="Settings" component={Settings} />
        </MainStack.Navigator>
    );
};

export default MainStackNavigator;