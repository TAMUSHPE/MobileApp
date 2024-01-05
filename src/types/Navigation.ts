
import { ImageSourcePropType } from "react-native";
import { SetStateAction } from "react";
import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from '@react-navigation/native';
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Test } from '../types/GoogleSheetsTypes';
import { Committee } from "./Committees";
import { PublicUserInfo, UserFilter } from "./User";
import { SHPEEvent } from "./Events";

// Stacks
export type MainStackParams = {
    HomeDrawer: HomeDrawerParams;
    HomeBottomTabs: undefined;
    AdminDashboardStack: undefined;
    SettingsScreen: undefined;
    ProfileSettingsScreen: undefined;
    DisplaySettingsScreen: undefined;
    AccountSettingsScreen: undefined;
    FeedbackSettingsScreen: undefined;
    FAQSettingsScreen: undefined;
    AboutSettingsScreen: undefined;
    EventVerificationScreen: {
        id: string;
        mode: "sign-in" | "sign-out";
    };
    PublicProfile: {
        uid: string;
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

export type MembersStackParams = {
    MembersScreen: undefined;
    PublicProfile: {
        uid: string;
    }
};

export type ProfileSetupStackParams = {
    LoginScreen: undefined;
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
    PublicProfile: {
        uid: string;
    };
}


export type InvolvementStackParams = {
    InvolvementScreen: undefined;
    CommitteeScreen: {
        committee: Committee;
    };
    PublicProfile: {
        uid: string;
    };
    CommitteeEdit: {
        committee?: Committee;
    };
}

export type EventsStackParams = {
    EventsScreen: undefined;
    UpdateEvent: { event: SHPEEvent };
    EventInfo: { eventId: string };
    QRCode: { event: SHPEEvent };

    // Events related to event creation
    CreateEvent: undefined;
    SetGeneralEventDetails: { event: SHPEEvent };
    SetSpecificEventDetails: { event: SHPEEvent };
    FinalizeEvent: { event: SHPEEvent };
}

export type HomeStackParams = {
    Home: undefined;
    PublicProfile: {
        uid: string;
    }
}

export type AdminDashboardParams = {
    AdminDashboard: undefined;
    MemberOfTheMonthEditor: undefined;
    FeaturedSlideEditor: undefined;
    ResumeDownloader: undefined;
    ResetOfficeHours: undefined;
    RestrictionsEditor: undefined;
    Feedback: undefined;
    MemberSHPEConfirm: undefined;
    ResumeConfirm: undefined;
    Home: undefined;
    PublicProfile: {
        uid: string;
    }
}

// Drawers
export type HomeDrawerParams = {
    HomeStack: HomeStackParams;
    Logout: undefined;
    AdminDashboardStack: undefined;
    PublicProfile: {
        uid: string;
    }

    ProfileSettingsScreen: undefined;
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
    handleCardPress?: (uid: string) => string | void;
    navigation?: NativeStackNavigationProp<MembersStackParams>
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
    navigation?: NativeStackNavigationProp<MembersStackParams>
}


export type MemberCardProp = {
    handleCardPress?: (uid: string | void) => void;
    userData?: PublicUserInfo;
    navigation?: NativeStackNavigationProp<any>
}

export type EventProps = {
    event?: SHPEEvent;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

export type CommitteesListProps = {
    navigation: NativeStackNavigationProp<InvolvementStackParams>
}

export type CommitteeTeamCardProps = {
    userData: PublicUserInfo;
    navigation?: NativeStackNavigationProp<InvolvementStackParams>
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

export type CommitteeEditProps = {
    route: RouteProp<InvolvementStackParams, 'CommitteeEdit'>;
    navigation: NativeStackNavigationProp<InvolvementStackParams, 'CommitteeEdit'>;
};


export type SettingsProps = NativeStackScreenProps<MainStackParams, "SettingsScreen">;

// routes prop for screens
export type SettingsScreenRouteProp = RouteProp<MainStackParams, "SettingsScreen">;
export type MembersScreenRouteProp = RouteProp<MembersStackParams, "PublicProfile">;
export type CommitteeScreenRouteProp = RouteProp<InvolvementStackParams, "CommitteeScreen">;
export type UpdateEventScreenRouteProp = RouteProp<EventsStackParams, "UpdateEvent">;
export type SHPEEventScreenRouteProp = RouteProp<EventsStackParams, "EventInfo">;
export type EventVerificationScreenRouteProp = RouteProp<MainStackParams, "EventVerificationScreen">;
export type QRCodeScreenRouteProp = RouteProp<EventsStackParams, "QRCode">;
export type CommitteeEditRouteProp = RouteProp<InvolvementStackParams, 'CommitteeEdit'>;
export type CommitteeEditNavigationProp = NativeStackNavigationProp<InvolvementStackParams, 'CommitteeEdit'>;
