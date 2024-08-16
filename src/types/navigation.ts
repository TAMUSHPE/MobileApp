
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from '@react-navigation/native';
import { Committee } from "./committees";
import { PublicUserInfo } from "./user";
import { ExtendedEventType, SHPEEvent } from "./events";

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

export type ProfileSetupStackParams = {
    LoginScreen: undefined;
    SetupNameAndBio: undefined;
    SetupProfilePicture: undefined;
    SetupAcademicInformation: undefined;
    SetupInterests: undefined;
    SetupResume: undefined;
    MainStack: undefined;
}

export type MainStackParams = {
    HomeBottomTabs: undefined;
    EventVerificationScreen: {
        id: string;
        mode: "sign-in" | "sign-out";
    };
    QRCodeScanningScreen: undefined;
};

export type HomeStackParams = {
    Home: undefined;
    Members: undefined;
    MemberSHPE: undefined;

    // Event Screens
    EventInfo: { event: SHPEEvent };
    UpdateEvent: { event: SHPEEvent };
    QRCode: { event: SHPEEvent };

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

    // Settings Screens
    SettingsScreen: undefined;
    ProfileSettingsScreen: undefined;
    DisplaySettingsScreen: undefined;
    AccountSettingsScreen: undefined;
    FeedbackSettingsScreen: undefined;
    FAQSettingsScreen: undefined;
    AboutSettingsScreen: undefined;

    PublicProfile: { uid: string; };
}

export type ResourcesStackParams = {
    Resources: undefined;
    PointsLeaderboard: undefined;
    TestBank: undefined;
    ResumeBank: undefined;

    PublicProfile: { uid: string; };
}

export type EventsStackParams = {
    EventsScreen: { filter?: ExtendedEventType; committee?: string };
    PastEvents: undefined;
    UpdateEvent: { event: SHPEEvent };
    EventInfo: { event: SHPEEvent };
    QRCode: { event: SHPEEvent };
    QRCodeScanningScreen: undefined;


    // Events related to event creation
    CreateEvent: undefined;
    SetGeneralEventDetails: { event: SHPEEvent };
    SetSpecificEventDetails: { event: SHPEEvent };
    setLocationEventDetails: { event: SHPEEvent };
    FinalizeEvent: { event: SHPEEvent };
    EventVerificationScreen: { id: string; mode: "sign-in" | "sign-out"; };

    PublicProfile: { uid: string; };
    Home: undefined;
}

export type CommitteesStackParams = {
    CommitteesScreen: undefined;
    CommitteeInfo: { committee: Committee; };
    CommitteeEditor: { committee?: Committee; };

    // Event Screens
    EventInfo: { event: SHPEEvent };
    UpdateEvent: { event: SHPEEvent };
    QRCode: { event: SHPEEvent };


    PublicProfile: { uid: string; };
}

export type UserProfileStackParams = {
    PublicProfile: { uid: string; }
    PersonalEventLogScreen: undefined;
    ProfileSettingsScreen: undefined;
    MemberSHPE: undefined;

    // Event Screens
    EventInfo: { event: SHPEEvent };
    UpdateEvent: { event: SHPEEvent };
    QRCode: { event: SHPEEvent };
};



// Component Props
export type MemberCardProp = {
    handleCardPress?: (uid: string | void) => void;
    userData?: PublicUserInfo;
    displayPoints?: Boolean;
    navigation?: NativeStackNavigationProp<any>
}

export type EventProps = {
    event?: SHPEEvent;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

// Screen Props
export type UpdateEventScreenRouteProp = RouteProp<EventsStackParams, "UpdateEvent">;