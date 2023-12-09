import React, { useContext, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, setDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import ProfileBadge from '../components/ProfileBadge';
import HomeScreen from '../screens/Home';
import { Committee } from '../types/Committees';
import { HomeDrawerParams } from '../types/Navigation';
import { Images } from '../../assets';
import { StatusBar } from 'expo-status-bar';
import PublicProfileScreen from "../screens/PublicProfile";
import AdminDashboardStack from './AdminDashboardStack';
import { HomeStack } from './HomeStack'
import { getCommittees } from '../api/firebaseUtils';

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;
    const [committees, setCommittees] = useState<Committee[]>([]);

    useEffect(() => {
        const fetchCommittees = async () => {
            const response = await getCommittees();
            setCommittees(response)
        }

        fetchCommittees();
    }, []);

    const removeExpoPushToken = async () => {
        try {
            const expoPushToken = await AsyncStorage.getItem('@expoPushToken');
            if (expoPushToken) {
                const userDoc = doc(db, `users/${auth.currentUser?.uid}/private`, "privateInfo");
                await setDoc(userDoc, { expoPushTokens: arrayRemove(expoPushToken) }, { merge: true });
            }
        } catch (error) {
            console.error("Error removing token from Firestore: ", error);
        } finally {
            await AsyncStorage.removeItem('@expoPushToken');
        }
    }


    const signOutUser = async () => {
        try {
            await removeExpoPushToken();
            await signOut(auth);
        } catch (error) {
            console.error(error);
        } finally {
            await AsyncStorage.removeItem('@user');
            setUserInfo(undefined);
        }
    };


    const drawerItemLabelStyle = {
        color: userInfo?.private?.privateInfo?.settings?.darkMode ? "#EEE" : "#000"
    }

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{
                backgroundColor: "#191740"/* "dark-navy" is #191740. */,
                height: "100%"
            }}
        >
            <View className="flex-col bg-dark-navy w-full px-4 pb-4">
                <View className='flex-row mb-2 items-center'>
                    <TouchableOpacity
                        onPress={() => props.navigation.navigate("PublicProfile", { uid: auth.currentUser?.uid! })}
                    >
                        <Image
                            className="flex w-16 h-16 rounded-full mr-2"
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                        />
                    </TouchableOpacity>
                    <View className='flex-1 flex-col max-w-full'>
                        <Text className='text-white text-xl break-words mb-1'>{userInfo?.publicInfo?.displayName ?? "Username"}</Text>
                        <Text className='text-white text-sm break-words'>{userInfo?.publicInfo?.name ?? "Name"}</Text>
                        <View className='flex-row items-center'>
                            <View className='rounded-full w-2 h-2 bg-orange mr-1' />
                            <Text className='text-white text-sm break-words'>{`${userInfo?.publicInfo?.points ?? 0} points`}</Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row flex-wrap">
                    <ProfileBadge
                        text={userInfo?.publicInfo?.classYear}
                        badgeClassName='px-2 py-1 bg-maroon rounded-full inline-block mr-1 mb-1'
                        badgeColor='#500000'
                        textClassName='text-center text-xs'
                    />
                    <ProfileBadge
                        text={userInfo?.publicInfo?.major}
                        badgeClassName='px-2 py-1 bg-pale-blue rounded-full inline-block mr-1 mb-1'
                        badgeColor='#72A9EF'
                        textClassName='text-center text-xs'
                    />
                    {userInfo?.publicInfo?.committees?.map((committeeDocName, index) => {
                        const committeeData = committees.find(c => c.firebaseDocName === committeeDocName);
                        return (
                            <ProfileBadge
                                badgeClassName='p-2 max-w-2/5 rounded-full mr-1 mb-2'
                                text={committeeData?.name || "Unknown Committee"}
                                badgeColor={committeeData?.color || ""}
                                key={index}
                            />
                        );
                    })}
                </View>
            </View>
            <View className={`${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"} flex-grow`}>
                <DrawerItem
                    label="My Profile"
                    labelStyle={drawerItemLabelStyle}
                    onPress={() => {
                        props.navigation.navigate("PublicProfile", { uid: auth.currentUser?.uid });
                        props.navigation.closeDrawer();
                    }}
                />


                <DrawerItem
                    label="Settings"
                    labelStyle={drawerItemLabelStyle}
                    onPress={() => {
                        props.navigation.navigate("SettingsScreen");
                        props.navigation.closeDrawer();
                    }}
                />

                {userInfo?.publicInfo?.roles?.officer?.valueOf() &&
                    <DrawerItem
                        label="Admin Dashboard"
                        labelStyle={drawerItemLabelStyle}
                        onPress={() => {
                            props.navigation.navigate("AdminDashboardStack");
                            props.navigation.closeDrawer();
                        }}
                    />
                }

                <DrawerItem label="Logout" labelStyle={{ color: "#E55" }} onPress={() => signOutUser()} />
            </View>
        </DrawerContentScrollView>
    );
};

const HomeDrawerHeader = (props: DrawerHeaderProps) => {
    const insets = useSafeAreaInsets();
    return (
        <View
            style={{ paddingTop: insets.top }}
            className='bg-white'
        >
            <View className='shadow-black drop-shadow-lg flex-row px-5 pb-4'>
                <View className='flex-1 justify-center items-start'>
                    <Image
                        className="h-10 w-52"
                        source={Images.LOGO_LIGHT}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => props.navigation.openDrawer()}
                >
                    <Image
                        className="flex w-12 h-12 rounded-full"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL as string } : Images.DEFAULT_USER_PICTURE}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const HomeDrawer = () => {
    const Drawer = createDrawerNavigator<HomeDrawerParams>();
    return (
        <Drawer.Navigator
            initialRouteName="HomeStack"
            drawerContent={(props) => <HomeDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerPosition: "right",
            }}
        >
            <Drawer.Screen
                name="HomeStack"
                component={HomeStack}
                options={{
                    headerShown: true,
                    header: HomeDrawerHeader,
                }}
            />
            <Drawer.Screen
                name="PublicProfile"
                component={PublicProfileScreen}
            />
        </Drawer.Navigator>
    );
};

export default HomeDrawer;
