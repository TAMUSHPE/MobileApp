import React, { useContext, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, setDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { HomeDrawerParams } from '../types/Navigation';
import { Images } from '../../assets';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import TwitterSvg from '../components/TwitterSvg';
import PublicProfileScreen from "../screens/PublicProfile";
import { HomeStack } from './HomeStack'

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const { nationalExpiration, chapterExpiration, roles } = userInfo?.publicInfo ?? {};
    const isOfficer = roles ? roles.officer : false;
    const [isVerified, setIsVerified] = useState<boolean>(false);

    useEffect(() => {
        const checkVerificationStatus = () => {
            if (!nationalExpiration || !chapterExpiration) {
                return;
            }
            const nationalExpirationString = nationalExpiration;
            const chapterExpirationString = chapterExpiration;

            const currentDate = new Date();
            let isNationalValid = true;
            let isChapterValid = true;

            if (nationalExpirationString) {
                const nationalExpirationDate = new Date(nationalExpirationString);
                isNationalValid = currentDate <= nationalExpirationDate;
            }

            if (chapterExpirationString) {
                const chapterExpirationDate = new Date(chapterExpirationString);
                isChapterValid = currentDate <= chapterExpirationDate;
            }

            setIsVerified(isNationalValid && isChapterValid);
        };

        checkVerificationStatus();
    }, [])

    let badgeColor = '';
    if (isOfficer) {
        badgeColor = '#FCE300';
    } else if (isVerified) {
        badgeColor = '#500000';
    }


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

    console.log(isOfficer, isVerified, badgeColor)

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{
                backgroundColor: "#72A9BE"/* "dark-navy" is #191740. */,
                height: "100%",
            }}
        >
            <View className="flex-col bg-pale-blue w-full px-4 pb-4">
                <View className='flex-row mb-2 items-center'>
                    <TouchableOpacity
                        onPress={() => props.navigation.navigate("PublicProfile", { uid: auth.currentUser?.uid! })}
                    >
                        <Image
                            className="flex w-16 h-16 rounded-full mr-5"
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                        />
                    </TouchableOpacity>
                    <View className='flex-1 flex-col max-w-full'>
                        <View className='flex-row items-center'>
                            <Text className='text-white text-xl break-words font-semibold'>{userInfo?.publicInfo?.displayName ?? "Name"}</Text>
                            {(isOfficer || isVerified) && (
                                <TwitterSvg className="ml-2" color={badgeColor} />
                            )}
                        </View>
                        <Text className='text-white text-sm break-words font-semibold'>{`${userInfo?.publicInfo?.points ?? 0} points`}</Text>
                    </View>
                </View>
            </View>

            <View className={`${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"} flex-grow`}>
                <TouchableOpacity
                    className='flex-row ml-5 mt-5 mb-5 items-center'
                    onPress={() => {
                        props.navigation.navigate("PublicProfile", { uid: auth.currentUser?.uid });
                        props.navigation.closeDrawer();
                    }}
                >
                    <View style={{ minWidth: 30, justifyContent: 'center', alignItems: 'center' }}>
                        <FontAwesome name="user" color={drawerItemLabelStyle.color} size={30} />
                    </View>
                    <Text className="ml-3 font-semibold text-md" style={drawerItemLabelStyle}>View Profile</Text>
                </TouchableOpacity>

                {userInfo?.publicInfo?.roles?.officer?.valueOf() &&
                    <TouchableOpacity
                        className='flex-row mx-5 mb-5 items-center'
                        onPress={() => {
                            props.navigation.navigate("AdminDashboardStack");
                            props.navigation.closeDrawer();
                        }}
                    >
                        <View style={{ minWidth: 30, justifyContent: 'center', alignItems: 'center' }}>
                            <FontAwesome name="superpowers" color={drawerItemLabelStyle.color} size={30} />
                        </View>
                        <Text className="ml-3 font-semibold text-md" style={drawerItemLabelStyle}>Officer Dashboard</Text>
                    </TouchableOpacity>
                }
                <TouchableOpacity
                    className='flex-row mx-5 mb-5 items-center'
                    onPress={() => {
                        props.navigation.navigate("SettingsScreen");
                        props.navigation.closeDrawer();
                    }}
                >
                    <View style={{ minWidth: 30 }}>
                        <FontAwesome name="gear" color={drawerItemLabelStyle.color} size={30} />
                    </View>
                    <Text className="ml-3 font-semibold text-md" style={drawerItemLabelStyle}>Settings</Text>
                </TouchableOpacity>

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
