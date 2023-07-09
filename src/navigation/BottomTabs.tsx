import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { View, Text } from 'react-native'
// Screens
import HomeScreen from '../screens/Home';
import MembersScreen from '../screens/Members';
import ResourcesScreen from '../screens/Resources';
import HomeDrawer from './Drawer';



const HomeBottomTabs = () => {
    const HomeBottomTabs = createBottomTabNavigator();
    return (
        <HomeBottomTabs.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    let iconSize = 24;
                    let iconName: any = 'x-circle';
                    let iconColor = focused ? 'maroon' : 'black';
                    if (route.name === 'Home') {
                        iconName = 'home'
                    } else if (route.name === 'Resources') {
                        iconName = 'repo'
                    } else if (route.name === 'Members') {
                        iconName = 'search'
                    }
                    return <Octicons name={iconName} size={iconSize} color={iconColor} />
                },
                tabBarStyle: {
                    height: 65,
                    paddingBottom: 5,
                    paddingTop: -10,

                },
                headerShown: false,
                tabBarActiveTintColor: 'maroon', // the color of active icon
                tabBarInactiveTintColor: 'black',
            })}
        >
            <HomeBottomTabs.Screen name="Home" component={HomeDrawer} />
            <HomeBottomTabs.Screen name="Resources" component={ResourcesScreen} />
            <HomeBottomTabs.Screen name="Members" component={MembersScreen} />
        </HomeBottomTabs.Navigator >
    )
}

export default HomeBottomTabs;
