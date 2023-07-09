
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';


// Stacks
export type HomeStackNavigatorParamList = {
    HomeDrawer: HomeDrawerNavigatorParamList;
    MemberOfTheMonth: undefined;
    HomeBottomTabs: undefined;
    Settings: {
        userId: number;
    };
};

export type LoginStackNavigatorParamList = {
    Login: undefined;
    Register: undefined;
    HomeStack: undefined;
}

export type MainStackNavigatorParamList = {
    LoginStack: undefined;
    HomeStack: undefined;
};


// Drawers
export type HomeDrawerNavigatorParamList = {
    Home: undefined;
    Resources: undefined;
    Logout: undefined;
};


// Bottom Tabs
export type HomeBottomTabNavigatorParamList = {
    Home: undefined;
    Profile: {
        email: string;
    };
};


export type SettingsScreenRouteProp = RouteProp<HomeStackNavigatorParamList, "Settings">;
export type SettingsProps = NativeStackScreenProps<HomeStackNavigatorParamList, "Settings">;
