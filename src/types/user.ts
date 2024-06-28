import { Timestamp, FieldValue } from 'firebase/firestore';

/** Anything added to this document needs to be added to shpe-app-web/app/types/user.ts **/


/**
 * This interface represents the roles a user has. These values will only determine what the app looks like and **not** firebase read/write/edit/delete permissions.
 */
export interface Roles {
    reader?: boolean;
    officer?: boolean;
    admin?: boolean;
    developer?: boolean;
    representative?: boolean;
    lead?: boolean;
    secretary?: boolean;
    customTitle?: string;
};

export type RankChange = "decreased" | "same" | "increased";

/**
 * This interface represents a user's public information as it is stored in firestore and google sheets.
 * This information is accessible by anyone in the app.
 * Each argument must have a value, however some of these values may be "empty". For example, if a string's value is "", this means that there is no value in the data.
*/
export interface PublicUserInfo {
    // Firestore parameters
    uid?: string
    email?: string;
    displayName?: string;
    photoURL?: string;
    resumePublicURL?: string;
    roles?: Roles;
    name?: string;
    bio?: string;
    major?: string;
    classYear?: string;
    committees?: string[];
    pointsRank?: number;
    rankChange?: RankChange;
    nationalExpiration?: Timestamp;
    chapterExpiration?: Timestamp;
    resumeVerified?: boolean;
    interests?: string[];
    points?: number;
    pointsThisMonth?: number;
    isStudent?: boolean;
    isEmailPublic?: boolean;
};

/**
 * This interface represents the settings for the application.
 * Different sliders and values will be added to this over time.
 */
export interface AppSettings {
    darkMode?: boolean;
    useSystemDefault?: boolean;
}

/**
 * This interface represents a user's private information as it is stored in firestore. 
 * This information should only be visible to the user that owns it.
 */
export interface PrivateUserInfo {
    completedAccountSetup?: boolean;
    settings?: AppSettings;
    expoPushTokens?: string[];
    expirationDate?: Timestamp;
    resumeURL?: string;
    email?: string;
};


/**
 * Data which is used to moderate a user's functionality in the app.
 * This information should be viewable by the user and app admins. This data should NOT be able to be modified by the user. 
 */
export interface UserModerationData {
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


export type UserFilter = {
    classYear: string,
    major: string,
    role?: string
}

const generateClassYears = (): { year: string }[] => {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let i = currentYear - 5; i <= currentYear + 8; i++) {
        years.push({ year: i.toString(), iso: i.toString() });
    }

    return years;
};

export const classYears = generateClassYears();

export const MAJORS: Array<{ major: string, iso: string }> = [
    { major: 'Aerospace Engineering', iso: 'AERO' },
    { major: 'Architectural Engineering', iso: 'AREN' },
    { major: 'Biomedical Engineering', iso: 'BMEN' },
    { major: 'Chemical Engineering', iso: 'CHEN' },
    { major: 'Civil Engineering', iso: 'CVEN' },
    { major: 'Computer Engineering', iso: 'CPEN' },
    { major: 'Computer Science', iso: 'CSCE' },
    { major: 'Computing', iso: 'COMP' },
    { major: 'Data Engineering', iso: 'DAEN' },
    { major: 'Electrical Engineering', iso: 'ECEN' },
    { major: 'Electronic Systems Engineering Technology', iso: 'ESET' },
    { major: 'Environmental Engineering', iso: 'EVEN' },
    { major: 'General Engineering', iso: 'ENGR' },
    { major: 'Industrial & Systems Engineering', iso: 'ISEN' },
    { major: 'Industrial Distribution', iso: 'IDIS' },
    { major: 'Information Technology Service Management', iso: 'ITSV' },
    { major: 'Interdisciplinary Engineering', iso: 'ITDE' },
    { major: 'Manufacturing & Mechanical Engineering Technology', iso: 'MMET' },
    { major: 'Materials Science & Engineering', iso: 'MSEN' },
    { major: 'Mechanical Engineering', iso: 'MEEN' },
    { major: 'Multidisciplinary Engineering Technology', iso: 'MXET' },
    { major: 'Nuclear Engineering', iso: 'NUEN' },
    { major: 'Ocean Engineering', iso: 'OCEN' },
    { major: 'Petroleum Engineering', iso: 'PETE' },
    { major: 'Technology Management', iso: 'TCMG' },
    { major: 'Other', iso: 'OTHER' }
];
