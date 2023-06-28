import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import HomeScreen from '../screens/Home';
import MembersScreen from '../screens/Members';
import PublicProfileScreen from '../screens/PublicProfile';

const HomeBottomTabs = () => {
    const HomeBottomTabs = createBottomTabNavigator();
    return (
        <HomeBottomTabs.Navigator>
            <HomeBottomTabs.Screen name="Home" component={HomeScreen} />            
            <HomeBottomTabs.Screen name="Members" component={MembersScreen} />            
            <HomeBottomTabs.Screen name="PublicProfile" component={PublicProfileScreen} />            
        </HomeBottomTabs.Navigator>
    )
}

export default HomeBottomTabs;
