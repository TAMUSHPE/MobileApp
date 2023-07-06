import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from '../screens/Home';
import MembersScreen from '../screens/Members';
import PublicProfileScreen from '../screens/PublicProfile';
import HomeDrawer from './Drawer';

const HomeBottomTabs = () => {
    const HomeBottomTabs = createBottomTabNavigator();
    return (
        <HomeBottomTabs.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <HomeBottomTabs.Screen name="Home" component={HomeDrawer} />            
            <HomeBottomTabs.Screen name="Members" component={MembersScreen} />            
            <HomeBottomTabs.Screen name="PublicProfile" component={PublicProfileScreen} />            
        </HomeBottomTabs.Navigator>
    )
}

export default HomeBottomTabs;
