import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps, DrawerHeaderProps } from '@react-navigation/drawer';
import { HomeDrawerNavigatorParamList } from '../types/Navigation';
import { auth } from '../config/firebaseConfig';
import { Image, TouchableOpacity, View } from 'react-native';

// Screens
import HomeScreen from '../screens/Home';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../assets';

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const signOut = () => {
        auth.signOut()
            .then(() => {
                // Once signed out, forces user to login screen and resets navigation stack so that login is the only element.
                props.navigation.navigate("LoginStack");
                props.navigation.reset({
                    index: 0,
                    routes: [{ name: "LoginStack" }],
                })
            })
            .catch((error) => alert(error));
    };

    return (
        <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem label="Settings" onPress={() => props.navigation.navigate("Settings", { userId: 1234 })} />
            <DrawerItem label="Logout" labelStyle={{ color: "#E55" }} onPress={() => signOut()} />
        </DrawerContentScrollView>
    );
};

const HomeDrawerHeader = (props: DrawerHeaderProps) => {
    return (
        <SafeAreaView className="bg-white h-18 shadow-sm shadow-black flex-row-reverse">
            <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => props.navigation.openDrawer()}
            >
                <Image
                    className="flex w-10 h-10 m-5 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={auth?.currentUser?.photoURL ? Images.DEFAULT_USER_PICTURE : { uri: auth?.currentUser?.photoURL as string }}
                />
            </TouchableOpacity>
            <View className="flex">
                <Image
                    className="w-20 h-10"
                    source={Images.TAMU_SHPE_LOGO}
                />
            </View>
        </SafeAreaView>
    );
}

const HomeDrawer = () => {
    const HomeDrawer = createDrawerNavigator<HomeDrawerNavigatorParamList>();
    return (
        <HomeDrawer.Navigator
            initialRouteName="HomePage"
            drawerContent={(props) => <HomeDrawerContent {...props} />}
            screenOptions={{
                header: HomeDrawerHeader,
                drawerPosition: "right",
            }}
        >
            <HomeDrawer.Screen name="HomePage" component={HomeScreen} />
        </HomeDrawer.Navigator>
    )
};

export default HomeDrawer;
