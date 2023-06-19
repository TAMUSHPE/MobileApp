import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerNavigatorParamList } from '../types/Navigation';

// Screens
import Home from '../screens/Home';
import MembersList from '../screens/Members';
import TestScreen from '../screens/TestScreen';
import Setting from '../screens/Settings';

const Drawer = () => {
    const Drawer = createDrawerNavigator<DrawerNavigatorParamList>();
    return (
        <Drawer.Navigator>
            <Drawer.Screen name="Home" component={Home} />
            <Drawer.Screen name="Members" component={MembersList} />
            <Drawer.Screen name="Test" component={TestScreen} />
            <Drawer.Screen name="Settings" component={Setting} initialParams={{ userId: 20 }} />
        </Drawer.Navigator>
    )
}

export default Drawer