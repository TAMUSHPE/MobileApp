import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeDrawerNavigatorParamList } from '../types/Navigation';

// Screens
import HomeScreen from '../screens/Home';
import SettingsScreen from '../screens/Settings';

const HomeDrawer = () => {
    const HomeDrawer = createDrawerNavigator<HomeDrawerNavigatorParamList>();
    return (
        <HomeDrawer.Navigator>
            <HomeDrawer.Screen name="Home" component={HomeScreen} />
            <HomeDrawer.Screen name="Settings" component={SettingsScreen} initialParams={{ userId: 20 }} />
        </HomeDrawer.Navigator>
    )
}

export default HomeDrawer;
