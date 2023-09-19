import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * This interface represents the roles a user has. These values will only determine what the app looks like and **not** firebase read/write/edit/delete permissions.
 */
export interface Roles {
    reader?: boolean;
    officer?: boolean;
    admin?: boolean;
    developer?: boolean;
};

/**
 * This interface represents a user's public information as it is stored in firestore and google sheets.
 * This information is accessible by anyone in the app.
 * Each argument must have a value, however some of these values may be "empty". For example, if a string's value is "", this means that there is no value in the data.
 */
export type RankChange = "decreased" | "same" | "increased";
export interface PublicUserInfo {
    // Firestore parameters
    email?: string;
    tamuEmail?: string;
    displayName?: string;
    photoURL?: string;
    roles?: Roles;
    name?: string;
    bio?: string;
    major?: string;
    classYear?: string;
    committees?: Array<string>;
    pointsRank?: number;
    rankChange?: RankChange;
    // Google Sheets parameters
    points?: number;
};

/**
 * This is seperate from PublicUserInfo because the UID is not stored in the document.
 * This is used when the UID is needed that is not the currently logged in user.
 */
export interface PublicUserInfoUID extends PublicUserInfo {
    uid?: string
}

/**
 * This interface represents the settings for the application.
 * Different sliders and values will be added to this over time.
 */
export interface AppSettings {
    darkMode: boolean;
}

/**
 * This interface represents a user's private information as it is stored in firestore. 
 * This information should only be visible to the user that owns it.
 */
export interface PrivateUserInfo {
    completedAccountSetup?: boolean;
    settings?: AppSettings;
    expoPushTokens?: string[];
};


/**
 * Data which is used to moderate a user's functionality in the app.
 * This information should be viewable by the user and app admins. This data should NOT be able to be modified by the user. 
 */
export interface UserModerationData{
    canUseKnockOnWall?: boolean;
};

/**
 * This interface represents a user as it is stored in firebase-auth.
 * Private information is stored as a sub-collection which can only be accessed by the user that owns the information.
 */
export interface User {
    publicInfo?: PublicUserInfo;
    private?: {
        privateInfo?: PrivateUserInfo | undefined;
        moderationData?: UserModerationData;
    }
};

export interface MemberStatus {
    uid: string;
    timestamp: Timestamp | FieldValue;
}

export interface OfficerStatus extends MemberStatus {
    signedIn: boolean;
}

