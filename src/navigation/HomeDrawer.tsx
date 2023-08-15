import React, { useContext, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { doc, setDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import ProfileBadge from '../components/ProfileBadge';
import HomeScreen from '../screens/Home';
import { User } from '../types/User';
import { HomeDrawerParams } from '../types/Navigation';
import { Images } from '../../assets';

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const [localUser, setLocalUser] = useState<User | undefined>(undefined);
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext ?? {};
    if (!setUserInfo) {
        return null;
    }


    const removeExpoPushToken = async () => {
        const expoPushToken = await AsyncStorage.getItem('@expoPushToken');
        const userDoc = doc(db, `users/${auth.currentUser?.uid}/private`, "privateInfo");
        await setDoc(userDoc, { expoPushTokens: arrayRemove(expoPushToken) }, { merge: true })
        await AsyncStorage.removeItem('@expoPushToken');
    }

    const signOutUser = async () => {
        await removeExpoPushToken();
        signOut(auth)
            .then(() => {
                // Once signed out, forces user to login screen by setting the current user info to "undefined"
                AsyncStorage.removeItem('@user')
                setUserInfo(undefined);
            })
            .catch((error) => console.error(error));
    };

    useEffect(() => {
        const getLocalUser = () => {
            AsyncStorage.getItem("@user")
                .then(userJSON => {
                    const userData = userJSON ? JSON.parse(userJSON) : undefined;
                    setLocalUser(userData);
                })
                .catch(error => {
                    console.error(error);
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
                            key={committeeName}
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
        </SafeAreaView>
    );
}

const HomeDrawer = () => {
    const Drawer = createDrawerNavigator<HomeDrawerParams>();
    return (
        <Drawer.Navigator
            initialRouteName="HomeScreen"
            drawerContent={(props) => <HomeDrawerContent {...props} />}
            screenOptions={{
                header: HomeDrawerHeader,
                drawerPosition: "right",
            }}
        >
            <Drawer.Screen name="HomeScreen" component={HomeScreen} />
        </Drawer.Navigator>
    );
};

export default HomeDrawer;
