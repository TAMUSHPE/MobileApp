
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';


// Stacks
export type MainStackNavigatorParamList = {
    HomeDrawer: HomeDrawerNavigatorParamList;
    MemberOfTheMonth: undefined;
    HomeBottomTabs: undefined;
    ProfileSetup: undefined;
    SettingsScreen: {
        userId: number;
    };
};

export type AuthStackNavigatorParamList = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    ProfileSetup: undefined;
    MainStack: undefined;
};

export type MembersStackNavigatorParamList = {
    MembersScreen: undefined;
    PublicProfile: {
        email: string;
    }
};

export type ProfileSetupStackNavigatorParamList = {
    SetupNameAndBio: undefined;
    SetupProfilePicture: undefined;
    SetupAcademicInformation: undefined;
    SetupCommittees: undefined;
    MainStack: undefined;
    SetupNotification: undefined;
}

export type CommitteesStackNavigatorParamList = {
    CommitteesScreen: undefined;
}

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


export type SettingsScreenRouteProp = RouteProp<MainStackNavigatorParamList, "SettingsScreen">;
export type SettingsProps = NativeStackScreenProps<MainStackNavigatorParamList, "SettingsScreen">;

export type MembersScreenRouteProp = RouteProp<MembersStackNavigatorParamList, "PublicProfile">;
export type MembersProps = NativeStackScreenProps<MembersStackNavigatorParamList, "PublicProfile">;
