import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Octicons } from '@expo/vector-icons';
import { MembersStackNavigator } from './MembersStack';
import { CommitteesStackNavigator } from './CommitteesStack';
import { ResourcesStackNavigator } from './ResourcesStack';
import HomeDrawer from './HomeDrawer';


const HomeBottomTabs = () => {
    const HomeBottomTabs = createBottomTabNavigator();
    const insets = useSafeAreaInsets();

    return (
        <View
            className='flex-1 bg-offwhite'>
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
                            case 'ResourcesStack':
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
                        // height: 50,
                        // paddingBottom: 1,
                        // paddingTop: -10,

                    },
                    headerShown: false,
                    tabBarActiveTintColor: 'maroon',
                    tabBarInactiveTintColor: 'black',
                    tabBarShowLabel: false,
                })}
            >
                <HomeBottomTabs.Screen name="Home" component={HomeDrawer} />
                <HomeBottomTabs.Screen name="ResourcesStack" component={ResourcesStackNavigator} />
                <HomeBottomTabs.Screen name="Committees" component={CommitteesStackNavigator} />
                <HomeBottomTabs.Screen name="Members" component={MembersStackNavigator} />
            </HomeBottomTabs.Navigator >
        </View>
    );
};

export default HomeBottomTabs;
