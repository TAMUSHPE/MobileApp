
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {RouteProp} from '@react-navigation/native';


// Stacks
export type MainStackNavigatorParams = {
    HomeDrawer: HomeDrawerNavigatorParams;
    MemberOfTheMonth: undefined;
    HomeBottomTabs: undefined;
    ProfileSetup: undefined;
    SettingsScreen: {
        userId: number;
    };
};

export type AuthStackNavigatorParams = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    ProfileSetup: undefined;
    MainStack: undefined;
};

export type MembersStackNavigatorParams = {
    MembersScreen: undefined;
    PublicProfile: {
        email: string;
    }
};

export type ProfileSetupStackNavigatorParams = {
    SetupNameAndBio: undefined;
    SetupProfilePicture: undefined;
    SetupAcademicInformation: undefined;
    SetupCommittees: undefined;
    MainStack: undefined;
    SetupNotification: undefined;
}

export type ResourcesStackNavigatorParams = {
    Resources: undefined;
    PointsLeaderboard: undefined;
    TestBank: undefined;
    ResumeBank: undefined;
}


export type CommitteesStackNavigatorParams = {
    CommitteesScreen: undefined;
}

// Drawers
export type HomeDrawerNavigatorParams = {
    HomeScreen: undefined;
    Resources: undefined;
    Logout: undefined;
};


// Bottom Tabs
export type HomeBottomTabNavigatorParams = {
    Home: undefined;
    Profile: {
        email: string;
    };
};

export type ResourcesProps = {
    title:string;
    screen: keyof ResourcesStackNavigatorParams;
    image: number;
    navigation: NativeStackNavigationProp<ResourcesStackNavigatorParams>
}

export type SettingsScreenRouteProp = RouteProp<MainStackNavigatorParams, "SettingsScreen">;
export type SettingsProps = NativeStackScreenProps<MainStackNavigatorParams, "SettingsScreen">;

export type MembersScreenRouteProp = RouteProp<MembersStackNavigatorParams, "PublicProfile">;
export type MembersProps = NativeStackScreenProps<MembersStackNavigatorParams, "PublicProfile">;
