import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { HomeDrawerNavigatorParamList } from '../types/Navigation';
import { auth } from '../config/firebaseConfig';

// Screens
import HomeScreen from '../screens/Home';

const HomeDrawerContent = (props: DrawerContentComponentProps) => {
    const signOut = () => {
        auth.signOut()
            .then(() => {
                // Once signed out, forces user to login screen and resets navigation stack so that login is the only element.
                props.navigation.navigate("LoginStack");
                props.navigation.reset({
                    index: 0,
                    routes: [{ name: "LoginStack" }]
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

const HomeDrawer = () => {
    const HomeDrawer = createDrawerNavigator<HomeDrawerNavigatorParamList>();
    return (
        <HomeDrawer.Navigator
            initialRouteName="Home"
            drawerContent={(props) => <HomeDrawerContent {...props} />}
        >
            <HomeDrawer.Screen name="Home" component={HomeScreen} />
        </HomeDrawer.Navigator>
    )
};

export default HomeDrawer;
