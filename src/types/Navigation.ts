
import { ImageSourcePropType } from "react-native";
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from '@react-navigation/native';
import { PublicUserInfoUID } from "./User";
import { Test } from '../types/GoogleSheetsTypes';
import { Committee } from "./Committees";

// Stacks
export type MainStackParams = {
    HomeDrawer: HomeDrawerParams;
    HomeBottomTabs: undefined;
    AdminDashboard: undefined;
    SettingsScreen: undefined;
    SearchSettingsScreen: undefined;
    ProfileSettingsScreen: undefined;
    DisplaySettingsScreen: undefined;
    AccountSettingsScreen: undefined;
    AboutSettingsScreen: undefined;
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
    PublicProfile: {
        uid: string;
    };
}

export type EventsStackParams = {
    EventsScreen: undefined;
    CreateEvent: undefined;
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
    items: {
        title: string;
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

export type MembersProps = {
    userData?: PublicUserInfoUID
    handleOnPress?: any
    navigation: NativeStackNavigationProp<MembersStackParams>
}



export type CommitteesInfoProp = {
    selectedCommittee?: Committee | null
    navigation: NativeStackNavigationProp<CommitteesStackParams>
}

export type SettingsProps = NativeStackScreenProps<MainStackParams, "SettingsScreen">;

// routes prop for screens (not components) 
export type SettingsScreenRouteProp = RouteProp<MainStackParams, "SettingsScreen">;
export type MembersScreenRouteProp = RouteProp<MembersStackParams, "PublicProfile">;
