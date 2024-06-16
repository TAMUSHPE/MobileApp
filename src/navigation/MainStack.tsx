import React, { useContext } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserContext } from "../context/UserContext";
import { MainStackParams } from '../types/navigation';
import EventVerification from "../screens/events/EventVerification";
import QRCodeScanningScreen from "../screens/events/QRCodeScanningScreen";
import { HomeStack } from "./HomeStack";
import { ResourcesStack } from "./ResourcesStack";
import { EventsStack } from "./EventsStack";
import { CommitteesStack } from "./CommitteesStack";
import { UserProfileStack } from "./UserProfileStack";
import { Octicons } from '@expo/vector-icons';
import { Image, Text, View } from "react-native";
import { auth } from "../config/firebaseConfig";
import { Images } from "../../assets";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";


const MainStack = () => {
    const Stack = createNativeStackNavigator<MainStackParams>();

    return (
        <Stack.Navigator initialRouteName="HomeBottomTabs">
            {/* Main components */}
            <Stack.Screen name="HomeBottomTabs" options={{ headerShown: false }} component={HomeBottomTabs} />

            <Stack.Screen name="EventVerificationScreen" component={EventVerification} options={{ headerShown: false }} />
            <Stack.Screen name="QRCodeScanningScreen" component={QRCodeScanningScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

const HomeBottomTabs = () => {
    const BottomTabs = createBottomTabNavigator();

    const TAB_ICON_CONFIG: Record<TabName, OcticonIconName> = {
        HomeTab: 'home',
        ResourcesTab: 'rows',
        EventsTab: "calendar",
        CommitteesTab: 'stack',
        ProfileTab: 'person',
    };

    const activeIconColor = 'black';
    const inactiveIconColor = 'black';
    const iconSize = 28;

    const generateTabIcon = (routeName: TabName, focused: boolean): JSX.Element => {
        if (routeName == 'ProfileTab') {
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
        let tabName: string = routeName.replace('Tab', '');
        return (
            <View className='flex-col items-center justify-center pt-2'>
                <Octicons name={iconName} size={iconSize} color={iconColor} />
                <Text className='text-black'>{focused ? tabName : ""}</Text>
            </View>
        );
    };

    return (
        <View className='flex-1 bg-offwhite'>
            <BottomTabs.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused }) => generateTabIcon(route.name as TabName, focused),
                    headerShown: false,
                    tabBarActiveTintColor: 'maroon',
                    tabBarInactiveTintColor: 'black',
                    tabBarShowLabel: false,
                })}
            >
                <BottomTabs.Screen name="HomeTab" component={HomeStack} />
                <BottomTabs.Screen name="ResourcesTab" component={ResourcesStack} />
                <BottomTabs.Screen name="EventsTab" component={EventsStack} />
                <BottomTabs.Screen name="CommitteesTab" component={CommitteesStack} />
                <BottomTabs.Screen name="ProfileTab" component={UserProfileStack} />
            </BottomTabs.Navigator >
        </View>
    );
};

type OcticonIconName = React.ComponentProps<typeof Octicons>['name'];
type TabName = 'HomeTab' | 'ResourcesTab' | 'CommitteesTab' | 'ProfileTab' | 'EventsTab';

export { MainStack };
