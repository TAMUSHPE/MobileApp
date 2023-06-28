
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';

export type HomeStackNavigatorParamList = {
    HomeDrawer: HomeDrawerNavigatorParamList;
    PublicProfile: undefined;
    HomeBottomTabs: undefined;
}

export type HomeDrawerNavigatorParamList = {
    Home: undefined;
    Members: undefined;
    Settings: {
        userId: number;
    };
    Logout: undefined;
}

export type HomeBottomTabNavigatorParamList = {
    Home: undefined;
    Profile: {
        email: string;
    };
}

export type MainStackNavigatorParamList = {
    Login: undefined;
    Register: undefined;
    Home: undefined;
}


export type SettingsScreenRouteProp = RouteProp<HomeDrawerNavigatorParamList, "Settings">;
export type SettingsProps = NativeStackScreenProps<HomeDrawerNavigatorParamList, "Settings">;
