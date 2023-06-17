import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer';

import { DrawerNavigatorParamList } from './types';
import HomeStackNavigator from './MainStack';

import Feed from '../screens/MemberList';
import TestScreen from '../screens/TestScreen';

const Drawer = () => {
    const Drawer = createDrawerNavigator<DrawerNavigatorParamList>();

    return (
        <Drawer.Navigator>
            <Drawer.Screen
                name="HomeStack"
                component={HomeStackNavigator}
                options={{ headerShown: false }}
            />
            <Drawer.Screen name="Feed" component={Feed} />
            <Drawer.Screen name="Test" component={TestScreen} />
        </Drawer.Navigator>
    )
}

export default Drawer