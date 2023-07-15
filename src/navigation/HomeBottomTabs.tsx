import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { MembersStackNavigator } from './MembersStack';
import { CommitteesStackNavigator } from './CommitteesStack';

// Screens
import ResourcesScreen from '../screens/Resources';
import HomeDrawer from './HomeDrawer';


const HomeBottomTabs = () => {
    const HomeBottomTabs = createBottomTabNavigator();
    return (
        <HomeBottomTabs.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    const iconSize = 28;
                    const iconColor = focused ? 'maroon' : 'black';
                    var iconName: any = 'x-circle';

                    switch (route.name) {
                        case 'Home':
                            iconName = 'home';
                            break;
                        case 'Resources':
                            iconName = 'repo';
                            break;
                        case 'Committees':
                            iconName = 'people';
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
                    height: 50,
                    // paddingBottom: 5,
                    // paddingTop: -10,

                },
                headerShown: false,
                tabBarActiveTintColor: 'maroon',
                tabBarInactiveTintColor: 'black',
                tabBarShowLabel: false,
            })}
        >
            <HomeBottomTabs.Screen name="Home" component={HomeDrawer} />
            <HomeBottomTabs.Screen name="Resources" component={ResourcesScreen} />
            <HomeBottomTabs.Screen name="Committees" component={CommitteesStackNavigator} />
            <HomeBottomTabs.Screen name="Members" component={MembersStackNavigator} />
        </HomeBottomTabs.Navigator >
    );
};

export default HomeBottomTabs;
