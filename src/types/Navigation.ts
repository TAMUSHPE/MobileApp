
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';


// Stacks
export type HomeStackNavigatorParamList = {
    HomeDrawer: HomeDrawerNavigatorParamList;
    MemberOfTheMonth: undefined;
    HomeBottomTabs: undefined;
    SettingsScreen: {
        userId: number;
    };
};

export type LoginStackNavigatorParamList = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    HomeStack: undefined;
}

export type MainStackNavigatorParamList = {
    LoginStack: undefined;
    HomeStack: undefined;
};

export type MembersStackNavigatorParamList = {
    MembersScreen: undefined;
    PublicProfile: {
        email: string;
    }
};

// Drawers
export type HomeDrawerNavigatorParamList = {
    HomeScreen: undefined;
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


export type SettingsScreenRouteProp = RouteProp<HomeStackNavigatorParamList, "SettingsScreen">;
export type SettingsProps = NativeStackScreenProps<HomeStackNavigatorParamList, "SettingsScreen">;

export type MembersScreenRouteProp = RouteProp<MembersStackNavigatorParamList, "PublicProfile">;
export type MembersProps = NativeStackScreenProps<MembersStackNavigatorParamList, "PublicProfile">;
