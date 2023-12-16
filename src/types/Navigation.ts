
import { ImageSourcePropType } from "react-native";
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from '@react-navigation/native';
import { PublicUserInfo, UserFilter } from "./User";
import { Test } from '../types/GoogleSheetsTypes';
import { Committee } from "./Committees";
import { SHPEEventID } from "./Events";
import { MutableRefObject, SetStateAction } from "react";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

// Stacks
export type MainStackParams = {
    HomeDrawer: HomeDrawerParams;
    HomeBottomTabs: undefined;
    AdminDashboardStack: undefined;
    SettingsScreen: undefined;
    SearchSettingsScreen: undefined;
    ProfileSettingsScreen: undefined;
    DisplaySettingsScreen: undefined;
    AccountSettingsScreen: undefined;
    AboutSettingsScreen: undefined;
    EventVerificationScreen: {
        id: string;
    };
};

export type AuthStackParams = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    ProfileSetup: undefined;
    MainStack: undefined;
    LoginStudent: undefined;
    LoginGuest: undefined;
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
    SetupResume: undefined;
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
    CommitteeInfoScreen: {
        committee: Committee;
    };
    PublicProfile: {
        uid: string;
    };
    CommitteeEditor: {
        committee: Committee;
    }
}

export type EventsStackParams = {
    EventsScreen: undefined;
    CreateEvent: undefined;
    UpdateEvent: { event: SHPEEventID };
    EventInfo: { eventId: string };
    QRCode: { event: SHPEEventID };
}

export type HomeStackParams = {
    Home: undefined;
    PublicProfile: {
        uid: string;
    }
}

export type AdminDashboardParams = {
    AdminDashboard: undefined;
    CommitteeCreator: undefined;
    MemberOfTheMonthEditor: undefined;
    FeaturedSlideEditor: undefined;
    ResumeDownloader: undefined;
    ResetOfficeHours: undefined;
    RestrictionsEditor: undefined;
    MemberSHPEConfirm: undefined;
    ResumeConfirm: undefined;
    HomeBottomTabs: {
        screen: keyof HomeBottomTabParams;
    };

}

// Drawers
export type HomeDrawerParams = {
    HomeStack: HomeStackParams;
    Logout: undefined;
    AdminDashboardStack: undefined;
    PublicProfile: {
        uid: string;
    }
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
    userData: PublicUserInfo
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}

export type ResumeProps = {
    resumeData: PublicUserInfo
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}
export type TestBankProps = {
    testData: Test;
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}

export type MembersProps = {
    userData?: PublicUserInfo
    handleCardPress: (uid: string) => string | void;
    navigation?: NativeStackNavigationProp<MembersStackParams>
    officersList? : PublicUserInfo[]
    membersList? : PublicUserInfo[]
    loadMoreUsers?: () => void;
    hasMoreUser?:  boolean;
    setFilter?: React.Dispatch<SetStateAction<UserFilter>>;
    filter?: UserFilter;
    setLastUserSnapshot?: React.Dispatch<SetStateAction<QueryDocumentSnapshot<DocumentData> | null>>;
    canSearch?: boolean;
    numLimit?: number | null;
    setNumLimit?: React.Dispatch<SetStateAction<number | null>>;
    loading?: boolean;
    DEFAULT_NUM_LIMIT?: number | null;
}

export type EventProps = {
    event?: SHPEEventID;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

export type CommitteesTabProps = {
    navigation: NativeStackNavigationProp<CommitteesStackParams>
}

export type EventVerificationProps = {
    id?: string;
    navigation?: NativeStackNavigationProp<MainStackParams>
}

export type QRCodeProps = {
    event?: SHPEEventID;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

export type SettingsProps = NativeStackScreenProps<MainStackParams, "SettingsScreen">;

// routes prop for screens
export type SettingsScreenRouteProp = RouteProp<MainStackParams, "SettingsScreen">;
export type MembersScreenRouteProp = RouteProp<MembersStackParams, "PublicProfile">;
export type CommitteeInfoScreenRouteProp = RouteProp<CommitteesStackParams, "CommitteeInfoScreen">;
export type CommitteeEditorScreenRouteProp = RouteProp<CommitteesStackParams, "CommitteeEditor">;
export type UpdateEventScreenRouteProp = RouteProp<EventsStackParams, "UpdateEvent">;
export type SHPEEventScreenRouteProp = RouteProp<EventsStackParams, "EventInfo">;
export type EventVerificationScreenRouteProp = RouteProp<MainStackParams, "EventVerificationScreen">;
export type QRCodeScreenRouteProp = RouteProp<EventsStackParams, "QRCode">;

