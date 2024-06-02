
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from '@react-navigation/native';
import { Committee } from "./committees";
import { PublicUserInfo } from "./user";
import { SHPEEvent } from "./events";

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
    EventInfo: { eventId: string };
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
    EventVerificationScreen: { id: string; mode: "sign-in" | "sign-out"; };

    PublicProfile: { uid: string; };
}

export type CommitteesStackParams = {
    CommitteesScreen: undefined;
    CommitteeScreen: { committee: Committee; };
    CommitteeEditor: { committee?: Committee; };

    // Event Screens
    EventInfo: { eventId: string };
    UpdateEvent: { event: SHPEEvent };
    QRCode: { event: SHPEEvent };

    PublicProfile: { uid: string; };
}

export type PublicProfileStackParams = {
    PublicProfile: { uid: string; }
    PersonalEventLogScreen: undefined;

    // Settings Screens
    SettingsScreen: undefined;
    ProfileSettingsScreen: undefined;
    DisplaySettingsScreen: undefined;
    AccountSettingsScreen: undefined;
    FeedbackSettingsScreen: undefined;
    FAQSettingsScreen: undefined;
    AboutSettingsScreen: undefined;
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