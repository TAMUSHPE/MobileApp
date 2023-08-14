import React, { useContext, useEffect, useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import { HomeDrawerNavigatorParams } from '../types/Navigation';
import { Image, TouchableOpacity, View, Text } from 'react-native';
import { auth, db } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import { arrayRemove } from "firebase/firestore";
import HomeScreen from '../screens/Home';
import { Images } from '../../assets';
import { doc, setDoc } from 'firebase/firestore';
import ProfileBadge from '../components/ProfileBadge';
import { User } from '../types/User';

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }
    const { userInfo, setUserInfo } = userContext;

    const removeLocalUser = () => {
        AsyncStorage.removeItem('@user')
            .catch((err) => console.error(err));
    }
    const removeExpoPushToken = async () => {
        const expoPushToken = await AsyncStorage.getItem('@expoPushToken');
        const userDoc = doc(db, `users/${auth.currentUser?.uid}/private`, "privateInfo");
        await setDoc(userDoc, { expoPushTokens: arrayRemove(expoPushToken) }, { merge: true })
            .catch(err => console.error(err));
        await AsyncStorage.removeItem('@expoPushToken');
    }

    const signOutUser = async () => {
        await removeExpoPushToken();
        signOut(auth)
            .then(() => {
                // Once signed out, forces user to login screen by setting the current user info to "undefined"
                removeLocalUser();
                setUserInfo(undefined);
            })
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        const getLocalUser = () => {
            AsyncStorage.getItem("@user")
                .then(userJSON => {
                    const userData = userJSON ? JSON.parse(userJSON) : undefined;
                    setLocalUser(userData);
                })
                .catch(e => {
                    console.error(e);
                });
        };
        getLocalUser();
    }, [])

    return (
        <DrawerContentScrollView {...props}>
            <View className='flex-col bg-dark-navy w-full p-4'>
                <View>
                    <Image
                        className="flex w-16 h-16 rounded-full"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                </View>
                <View className="flex-row flex-wrap">
                    <ProfileBadge
                        text="Test"
                    />
                    <ProfileBadge />
                    {userInfo?.publicInfo?.committees?.map((committeeName: string, index) => (
                        <ProfileBadge
                            key={index}
                            text={committeeName}
                        />
                    ))}
                </View>
            </View>
            <DrawerItem label="Settings" onPress={() => props.navigation.navigate("SettingsScreen", { userId: 1234 })} />
            {localUser?.publicInfo?.roles?.officer?.valueOf()
                && <DrawerItem label="Admin Dashboard" onPress={() => props.navigation.navigate("AdminDashboard")} />}

            <DrawerItem label="Logout" labelStyle={{ color: "#E55" }} onPress={() => signOutUser()} />


        </DrawerContentScrollView>
    );
};

const HomeDrawerHeader = (props: DrawerHeaderProps) => {
    return (
        <SafeAreaView className="bg-offwhite h-18 shadow-black drop-shadow-lg flex-row px-5 pb-2 pt-3">
            <View
                className='flex-1 justify-center items-start'
            >
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
        </SafeAreaView >
    );
}

const HomeDrawer = () => {
    const HomeDrawer = createDrawerNavigator<HomeDrawerNavigatorParams>();
    return (
        <HomeDrawer.Navigator
            initialRouteName="HomeScreen"
            drawerContent={(props) => <HomeDrawerContent {...props} />}
            screenOptions={{
                header: HomeDrawerHeader,
                drawerPosition: "right",
            }}
        >
            <HomeDrawer.Screen name="HomeScreen" component={HomeScreen} />
        </HomeDrawer.Navigator>
    );
};

export default HomeDrawer;
