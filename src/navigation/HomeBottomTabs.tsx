import React from 'react';
import { View, Text, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { PublicProfileStack } from './PublicProfileStack';
import { CommitteesStack } from './CommitteesStack';
import { ResourcesStack } from './ResourcesStack';
import { EventsStack } from './EventsStack';
import { HomeStack } from './HomeStack';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';

const TAB_ICON_CONFIG: Record<TabName, OcticonIconName> = {
    Home: 'home',
    ResourcesStack: 'rows',
    Events: "calendar",
    Committees: 'stack',
    Profile: 'person',
};

const activeIconColor = 'black';
const inactiveIconColor = 'black';
const iconSize = 28;


const generateTabIcon = (routeName: TabName, focused: boolean): JSX.Element => {
    if (routeName == 'Profile') {
        return (
            <View className='flex-col items-center justify-center'>
                <Image
                    source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                    className={`${focused ? 'border-2 border-black' : 'border-2 border-transparent'}`}
                />
            </View>
        );
    }

    const iconName = TAB_ICON_CONFIG[routeName] || 'x-circle';
    const iconColor = focused ? activeIconColor : inactiveIconColor;
    let tabName: string = routeName;
    if (tabName === 'ResourcesStack') {
        tabName = 'Resources';
    }
    return (
        <View className='flex-col items-center justify-center pt-2'>
            <Octicons name={iconName} size={iconSize} color={iconColor} />
            <Text className='text-black'>{focused ? tabName : ""}</Text>
        </View>
    );
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
                <BottomTabs.Screen name="Home" component={HomeStack} />
                <BottomTabs.Screen name="ResourcesStack" component={ResourcesStack} />
                <BottomTabs.Screen name="Events" component={EventsStack} />
                <BottomTabs.Screen name="Committees" component={CommitteesStack} />
                <BottomTabs.Screen name="Profile" component={PublicProfileStack} />
            </BottomTabs.Navigator >
        </View>
    );
};

type OcticonIconName = React.ComponentProps<typeof Octicons>['name'];
type TabName = 'Home' | 'ResourcesStack' | 'Committees' | 'Profile' | 'Events';

export default HomeBottomTabs;
