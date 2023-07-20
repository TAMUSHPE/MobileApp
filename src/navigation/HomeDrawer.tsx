import React, { useContext } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import { HomeDrawerNavigatorParamList } from '../types/Navigation';
import { Image, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';

// Screens
import HomeScreen from '../screens/Home';
import { Images } from '../../assets';

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }

    // Note: Change this to see if has completed profile setup
    const { setUserInfo } = userContext;
    const removeLocalUser = async () => {
        try {
            await AsyncStorage.removeItem('@user')
        } catch (e) {
            console.log(e);
        }

    }
    const signOutUser = () => {
        signOut(auth)
            .then(() => {
                // Once signed out, forces user to login screen and resets navigation stack so that login is the only element.
                removeLocalUser();
                setUserInfo(undefined);
            })
            .catch((err) => console.error(err));
    };

    return (
        <DrawerContentScrollView {...props}>
            <DrawerItem label="Settings" onPress={() => props.navigation.navigate("SettingsScreen", { userId: 1234 })} />
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
                    className="flex w-10 h-10 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL as string } : Images.DEFAULT_USER_PICTURE}
                />
            </TouchableOpacity>
        </SafeAreaView >
    );
}

const HomeDrawer = () => {
    const HomeDrawer = createDrawerNavigator<HomeDrawerNavigatorParamList>();
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
