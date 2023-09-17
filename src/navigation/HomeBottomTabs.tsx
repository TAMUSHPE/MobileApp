import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { MembersStack } from './MembersStack';
import { CommitteesStack } from './CommitteesStack';
import { ResourcesStack } from './ResourcesStack';
import HomeDrawer from './HomeDrawer';
import { EventsStack } from './EventsStack';

const TAB_ICON_CONFIG: Record<TabName, OcticonIconName> = {
    Home: 'home',
    ResourcesStack: 'repo',
    Committees: 'people',
    Members: 'search',
    Events: "calendar",
};

const activeIconColor = 'maroon';
const inactiveIconColor = 'black';
const iconSize = 28;


const generateTabIcon = (routeName: TabName, focused: boolean): JSX.Element => {
    const iconName = TAB_ICON_CONFIG[routeName] || 'x-circle';
    const iconColor = focused ? activeIconColor : inactiveIconColor;
    return <Octicons name={iconName} size={iconSize} color={iconColor} />;
};

const HomeBottomTabs = () => {
    const BottomTabs = createBottomTabNavigator();

    return (
        <View
            className='flex-1 bg-offwhite'>
            <BottomTabs.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused }) => generateTabIcon(route.name as TabName, focused),
                    headerShown: false,
                    tabBarActiveTintColor: 'maroon',
                    tabBarInactiveTintColor: 'black',
                    tabBarShowLabel: false,
                })}
            >
                <BottomTabs.Screen name="Home" component={HomeDrawer} />
                <BottomTabs.Screen name="ResourcesStack" component={ResourcesStack} />
                <BottomTabs.Screen name="Events" component={EventsStack} />
                <BottomTabs.Screen name="Committees" component={CommitteesStack} />
                <BottomTabs.Screen name="Members" component={MembersStack} />
            </BottomTabs.Navigator >
        </View>
    );
};

type OcticonIconName = 'number' | 'home' | 'repo' | 'people' | 'search' | 'calendar' | 'x-circle' // Manually define, expo doesn't provide type
type TabName = 'Home' | 'ResourcesStack' | 'Committees' | 'Members' | 'Events';

export default HomeBottomTabs;
