
import { ImageSourcePropType } from "react-native";
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';
import { PublicUserInfoUID } from "./User";
import { Test } from '../types/GoogleSheetsTypes';

// Stacks
export type MainStackParams = {
    HomeDrawer: HomeDrawerParams;
    HomeBottomTabs: undefined;
    AdminDashboard: undefined;
    SettingsScreen: {
        userId: number;
    };
};

export type AuthStackParams = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    ProfileSetup: undefined;
    MainStack: undefined;
};

export type MembersStackParams = {
    MembersScreen: undefined;
    PublicProfile: {
        uid: string;
    }
};

export type ProfileSetupStackParams = {
    SetupNameAndBio: undefined;
    SetupProfilePicture: undefined;
    SetupAcademicInformation: undefined;
    SetupCommittees: undefined;
    MainStack: undefined;
    SetupNotification: undefined;
}

export type ResourcesStackParams = {
    Resources: undefined;
    PointsLeaderboard: undefined;
    TestBank: undefined;
    ResumeBank: undefined;
    PointsInfo: undefined;
    PublicProfile: {
        uid: string;
    };
}


export type CommitteesStackParams = {
    CommitteesScreen: undefined;
}

export type AdminDashboardParams = {
    AdminDashboard: undefined;
    CommitteesEditor: undefined;
}

// Drawers
export type HomeDrawerParams = {
    HomeScreen: undefined;
    AdminDashboardStack: undefined;
    Logout: undefined;
};


// Bottom Tabs
export type HomeBottomTabParams = {
    Home: undefined;
    Profile: {
        email: string;
    };
};

export type ResourcesProps = {
    items:{
        title:string;
        screen: keyof ResourcesStackParams;
        image: ImageSourcePropType;
        "bg-color": string;
        "text-color": string;
    },
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}

export type PointsProps = {
    userData: PublicUserInfoUID
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}

export type TestBankProps = {
    testData: Test;
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}

export type SettingsScreenRouteProp = RouteProp<MainStackParams, "SettingsScreen">;
export type SettingsProps = NativeStackScreenProps<MainStackParams, "SettingsScreen">;

export type MembersScreenRouteProp = RouteProp<MembersStackParams, "PublicProfile">;
export type MembersProps = NativeStackScreenProps<MembersStackParams, "PublicProfile">;
