
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';

export type HomeStackNavigatorParamList = {
    HomeDrawer: HomeDrawerNavigatorParamList;
    MemberOfTheMonth: undefined;
    HomeBottomTabs: undefined;
    Settings: {
        userId: number;
    };
};

export type HomeDrawerNavigatorParamList = {
    Home: undefined;
    Members: undefined;
    Logout: undefined;
};

export type HomeBottomTabNavigatorParamList = {
    Home: undefined;
    Profile: {
        email: string;
    };
};

export type MainStackNavigatorParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
};

export type SettingsScreenRouteProp = RouteProp<HomeStackNavigatorParamList, "Settings">;
export type SettingsProps = NativeStackScreenProps<HomeStackNavigatorParamList, "Settings">;
