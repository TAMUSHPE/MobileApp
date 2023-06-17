
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';

export type HomeStackNavigatorParamList = {
    Home_: DrawerNavigatorParamList;
    Polling: undefined;
}

export type DrawerNavigatorParamList = {
    Home: undefined;
    Members: undefined;
    Test: undefined;
    Settings: {
        userId: number;
    };
}

export type SettingsScreenRouteProp = RouteProp<DrawerNavigatorParamList, 'Settings'>;
export type SettingsProps = NativeStackScreenProps<DrawerNavigatorParamList, "Settings">;