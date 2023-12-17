import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { MembersStack } from './MembersStack';
import { CommitteesStack } from './CommitteesStack';
import { ResourcesStack } from './ResourcesStack';
import HomeDrawer from './HomeDrawer';
import { EventsStack } from './EventsStack';

const TAB_ICON_CONFIG: Record<TabName, OcticonIconName> = {
    Home: 'home',
    ResourcesStack: 'rows',
    Events: "calendar",
    Committees: 'stack',
    Members: 'person',
};

const activeIconColor = 'maroon';
const inactiveIconColor = 'black';
const iconSize = 28;


const generateTabIcon = (routeName: TabName, focused: boolean): JSX.Element => {
    const iconName = TAB_ICON_CONFIG[routeName] || 'x-circle';
    const iconColor = focused ? activeIconColor : inactiveIconColor;
    let tabName: string = routeName;
    if (tabName === 'ResourcesStack') {
        tabName = 'Resources';
    }
    return (
        <View className='flex-col items-center justify-center pt-2'>
            <Octicons name={iconName} size={iconSize} color={iconColor} />
            <Text className='text-maroon'>{focused ? tabName : ""}</Text>

        </View>
    )
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
type OcticonIconName = React.ComponentProps<typeof Octicons>['name'];
type TabName = 'Home' | 'ResourcesStack' | 'Committees' | 'Members' | 'Events';

export default HomeBottomTabs;
