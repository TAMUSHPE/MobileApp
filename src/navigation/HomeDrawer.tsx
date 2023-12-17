import React, { useContext, useEffect, useState } from 'react';
import { Image, TouchableOpacity, View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, setDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { getBadgeColor, isMemberVerified } from '../helpers/membership';
import { HomeDrawerParams } from '../types/Navigation';
import { Images } from '../../assets';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import TwitterSvg from '../components/TwitterSvg';
import PublicProfileScreen from "../screens/PublicProfile";
import { HomeStack } from './HomeStack'


/**
 * HomeDrawerContent - Component for rendering the drawer in the Home screen.
 * @param {DrawerContentComponentProps} props - Props for the component.
 */
const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const [isVerified, setIsVerified] = useState<boolean>(false);
    const { nationalExpiration, chapterExpiration, roles } = userInfo?.publicInfo ?? {};
    const isOfficer = roles ? roles.officer : false;
    let badgeColor = getBadgeColor(isOfficer!, isVerified);

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])


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

    const DrawerButton = ({ iconName, label, onPress, buttonClassName }: { iconName: FontAwesomeIconName, label: string, onPress: () => void, buttonClassName: string }) => (
        <TouchableOpacity
            className={buttonClassName}
            onPress={onPress}
        >
            <View style={{ minWidth: 30, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome name={iconName} color={drawerItemLabelStyle.color} size={30} />
            </View>
            <Text className="ml-3 font-semibold text-md" style={drawerItemLabelStyle}>{label}</Text>
        </TouchableOpacity>
    );


    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{
                backgroundColor: "#72A9BE"/* "dark-navy" is #191740. */,
                height: "100%",
            }}
        >
            {/* Profile Header */}
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

            {/* Drawer Items */}
            <View className={`${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"} flex-grow`}>
                <DrawerButton
                    iconName="user"
                    label='View Profile'
                    buttonClassName='flex-row ml-5 mt-5 mb-5 items-center'
                    onPress={() => {
                        props.navigation.navigate("PublicProfile", { uid: auth.currentUser?.uid });
                        props.navigation.closeDrawer();
                    }}
                />

                {userInfo?.publicInfo?.roles?.officer?.valueOf() &&
                    <DrawerButton
                        iconName="superpowers"
                        label='Officer Dashboard'
                        buttonClassName='flex-row mx-5 mb-5 items-center'
                        onPress={() => {
                            props.navigation.navigate("AdminDashboardStack");
                            props.navigation.closeDrawer();
                        }}
                    />
                }
                <DrawerButton
                    iconName="gear"
                    label='Settings'
                    buttonClassName='flex-row mx-5 mb-5 items-center'
                    onPress={() => {
                        props.navigation.navigate("SettingsScreen");
                        props.navigation.closeDrawer();
                    }}
                />

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

type FontAwesomeIconName = React.ComponentProps<typeof FontAwesome>['name'];

export default HomeDrawer;
