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
        <SafeAreaView className="bg-white h-18 shadow-black drop-shadow-lg flex-row px-5 pb-2 pt-3">
            <View
                className='flex-1 justify-center items-start'
            >
                <Image
                    className="h-10 w-52"
                    source={require('../../assets/logo_light.png')}
                />
            </View>

            <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => props.navigation.openDrawer()}
            >
                <Image
                    className="flex w-10 h-10 rounded-full"
                    source={{
                        uri: auth?.currentUser?.photoURL as string
                    }}
                />
            </TouchableOpacity>
        </SafeAreaView >
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
