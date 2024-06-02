
import { ImageSourcePropType } from "react-native";
import { SetStateAction } from "react";
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from '@react-navigation/native';
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Test } from './googleSheetsTypes';
import { Committee } from "./committees";
import { PublicUserInfo, UserFilter } from "./user";
import { SHPEEvent } from "./events";


export type MainStackParams = {
    HomeBottomTabs: undefined;
    EventVerificationScreen: {
        id: string;
        mode: "sign-in" | "sign-out";
    };

};

export type AuthStackParams = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    ProfileSetup: undefined;
    MainStack: undefined;
    LoginStudent: undefined;
    LoginGuest: undefined;
    GuestVerification: undefined;
    GuestRecoveryAccount: undefined;
};

export type PublicProfileStackParams = {
    PublicProfile: { uid: string; }
    SettingsScreen: undefined;
    PersonalEventLogScreen: undefined;

    // Settings Screens
    ProfileSettingsScreen: undefined;
    DisplaySettingsScreen: undefined;
    AccountSettingsScreen: undefined;
    FeedbackSettingsScreen: undefined;
    FAQSettingsScreen: undefined;
    AboutSettingsScreen: undefined;


};

export type ProfileSetupStackParams = {
    LoginScreen: undefined;
    SetupNameAndBio: undefined;
    SetupProfilePicture: undefined;
    SetupAcademicInformation: undefined;
    SetupInterests: undefined;
    SetupResume: undefined;
    MainStack: undefined;
}

export type ResourcesStackParams = {
    Resources: undefined;
    PointsLeaderboard: undefined;
    TestBank: undefined;
    ResumeBank: undefined;
    PublicProfile: {
        uid: string;
    };
}


export type CommitteesStackParams = {
    CommitteesScreen: undefined;
    CommitteeScreen: {
        committee: Committee;
    };
    PublicProfile: {
        uid: string;
    };
    CommitteeEditor: {
        committee?: Committee;
    };
    EventInfo: undefined;
}

export type EventsStackParams = {
    EventsScreen: undefined;
    UpdateEvent: { event: SHPEEvent };
    EventInfo: { eventId: string };
    QRCode: { event: SHPEEvent };
    QRCodeScanningScreen: undefined;

    // Events related to event creation
    CreateEvent: undefined;
    SetGeneralEventDetails: { event: SHPEEvent };
    SetSpecificEventDetails: { event: SHPEEvent };
    setLocationEventDetails: { event: SHPEEvent };
    FinalizeEvent: { event: SHPEEvent };
}

export type HomeStackParams = {
    Home: undefined;
    PublicProfile: { uid: string; };
    MemberSHPE: undefined;
    Members: undefined;

    // Admin Dashboard Screens
    AdminDashboard: undefined;
    MOTMEditor: undefined;
    ResumeDownloader: undefined;
    LinkEditor: undefined;
    RestrictionsEditor: undefined;
    FeedbackEditor: undefined;
    MemberSHPEConfirm: undefined;
    CommitteeConfirm: undefined;
    ResumeConfirm: undefined;
    ShirtConfirm: undefined;
    InstagramPoints: undefined;

    // Event Screens
    EventInfo: { eventId: string };
    UpdateEvent: { event: SHPEEvent };
    QRCode: { event: SHPEEvent };

}

// Bottom Tabs
export type HomeBottomTabParams = {
    Home: undefined;
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
    handleCardPress?: (uid: string) => string | void;
    navigation?: NativeStackNavigationProp<MainStackParams>
    officersList?: PublicUserInfo[]
    membersList?: PublicUserInfo[]
    loadMoreUsers?: () => void;
    hasMoreUser?: boolean;
    setFilter?: React.Dispatch<SetStateAction<UserFilter>>;
    filter?: UserFilter;
    setLastUserSnapshot?: React.Dispatch<SetStateAction<QueryDocumentSnapshot<DocumentData> | null>>;
    canSearch?: boolean;
    numLimit?: number | null;
    setNumLimit?: React.Dispatch<SetStateAction<number | null>>;
    loading?: boolean;
    DEFAULT_NUM_LIMIT?: number | null;
}

export type MemberListProps = {
    handleCardPress: (uid: string) => string | void;
    users: PublicUserInfo[];
    navigation?: NativeStackNavigationProp<MainStackParams>
}

interface SelectedPublicUserInfo extends PublicUserInfo {
    selected?: boolean;
}

export type MemberCardProp = {
    handleCardPress?: (uid: string | void) => void;
    userData?: PublicUserInfo;
    displayPoints?: Boolean;
    navigation?: NativeStackNavigationProp<any>
}


export type MemberCardMultipleSelectProp = {
    handleCardPress?: (uid: string | void) => void;
    userData?: SelectedPublicUserInfo;
}

export type IShpeProps = {
    navigation?: NativeStackNavigationProp<HomeStackParams>
}

export type EventProps = {
    event?: SHPEEvent;
    navigation: NativeStackNavigationProp<EventsStackParams>
}


export type CommitteeTeamCardProps = {
    userData: PublicUserInfo;
    navigation?: NativeStackNavigationProp<CommitteesStackParams>
}


export type EventVerificationProps = {
    id?: string;
    mode?: "sign-in" | "sign-out";
    navigation?: NativeStackNavigationProp<MainStackParams>;
}

export type QRCodeProps = {
    event?: SHPEEvent;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

export type CommitteeEditorProps = {
    route: RouteProp<CommitteesStackParams, 'CommitteeEditor'>;
    navigation: NativeStackNavigationProp<CommitteesStackParams, 'CommitteeEditor'>;
};


export type SettingsProps = NativeStackScreenProps<PublicProfileStackParams, "SettingsScreen">;

// routes prop for screens
export type SettingsScreenRouteProp = RouteProp<PublicProfileStackParams, "SettingsScreen">;
export type MembersScreenRouteProp = RouteProp<PublicProfileStackParams, "PublicProfile">;
export type CommitteeScreenRouteProp = RouteProp<CommitteesStackParams, "CommitteeScreen">;
export type UpdateEventScreenRouteProp = RouteProp<EventsStackParams, "UpdateEvent">;
export type SHPEEventScreenRouteProp = RouteProp<EventsStackParams, "EventInfo">;
export type EventVerificationScreenRouteProp = RouteProp<MainStackParams, "EventVerificationScreen">;
export type QRCodeScreenRouteProp = RouteProp<EventsStackParams, "QRCode">;
export type CommitteeEditorRouteProp = RouteProp<CommitteesStackParams, 'CommitteeEditor'>;
export type CommitteeEditorNavigationProp = NativeStackNavigationProp<CommitteesStackParams, 'CommitteeEditor'>;
export type CommitteeScreenProps = NativeStackScreenProps<CommitteesStackParams, 'CommitteeScreen'>;
export type CommitteesListProps = { navigation: NativeStackNavigationProp<CommitteesStackParams, 'CommitteesScreen'>; };
export type CommitteesScreenScreenProps = NativeStackScreenProps<CommitteesStackParams, 'CommitteesScreen'>;
