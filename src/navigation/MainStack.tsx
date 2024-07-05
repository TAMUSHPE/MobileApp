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
import { Image, Text, View, useColorScheme } from "react-native";
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
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const BottomTabs = createBottomTabNavigator();

    const TAB_ICON_CONFIG: Record<TabName, OcticonIconName> = {
        HomeTab: 'home',
        ResourcesTab: 'book',
        EventsTab: "calendar",
        CommitteesTab: 'people',
        ProfileTab: 'person',
    };

    const generateTabIcon = (routeName: TabName, focused: boolean): JSX.Element => {
        if (routeName == 'ProfileTab') {
            return (
                <View className='flex-col items-center justify-center'>
                    <Image
                        source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                        className={`${focused ? (darkMode ? 'border-2 border-white' : 'border-2 border-black') : 'border-2 border-transparent'}`}
                    />
                </View>
            );
        }

        const iconName = TAB_ICON_CONFIG[routeName] || 'x-circle';
        const iconColor = darkMode ? "white" : "black";

        let tabName: string = routeName.replace('Tab', '');

        return (
            <View className='flex-col items-center justify-center pt-2'>
                <Octicons name={iconName} size={24} color={iconColor} />
                <Text className={`text-xs ${darkMode ? "text-white" : "text-black"}`}>{focused ? tabName : ""}</Text>
            </View>
        );
    };

    return (
        <View className='flex-1 '>
            <BottomTabs.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused }) => generateTabIcon(route.name as TabName, focused),
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: darkMode ? 'black' : 'white',
                        borderTopWidth: 0,
                    }
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
