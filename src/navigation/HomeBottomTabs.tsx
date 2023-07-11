import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { MembersStackNavigator } from './MembersStack';

// Screens
import ResourcesScreen from '../screens/Resources';
import HomeDrawer from './HomeDrawer';


const HomeBottomTabs = () => {
    const HomeBottomTabs = createBottomTabNavigator();
    return (
        <HomeBottomTabs.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    const iconSize = 24;
                    const iconColor = focused ? 'maroon' : 'black';
                    var iconName: any = 'x-circle';

                    switch (route.name) {
                        case 'Home':
                            iconName = 'home';
                            break;
                        case 'Resources':
                            iconName = 'repo';
                            break;
                        case 'Members':
                            iconName = 'search';
                            break;
                        default:
                            iconName = 'x-circle';
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
            <HomeBottomTabs.Screen name="Members" component={MembersStackNavigator} />
        </HomeBottomTabs.Navigator >
    );
};

export default HomeBottomTabs;
