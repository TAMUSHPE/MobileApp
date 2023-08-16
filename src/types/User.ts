export type CommitteeData = {
    id: number,
    name: string,
    color: string,
};

export const committeesList: Array<CommitteeData> = [
    { id: 1, name: "Technical Affairs", color: "#777", },
    { id: 2, name: "MentorSHPE", color: "#404e5a", },
    { id: 3, name: "Scholastic", color: "#F2CC10", },
    { id: 4, name: "SHPEtinas", color: "#1EFF42", },
    { id: 5, name: "Secretary", color: "#FFA0D5", },
    { id: 6, name: "Public Relations", color: "#9337FF", },
    { id: 7, name: "Internal Affairs", color: "#051DDB", },
];

/**
 * This interface represents the roles a user has. These values will only determine what the app looks like and **not** firebase read/write/edit/delete permissions.
 */
export interface Roles {
    reader: boolean;
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
 * This is seperate from PublicUserInfo because the UID is not stored in the document.
 * This is used when the UID is needed that is not the currently logged in user.
 */
export interface PublicUserInfoUID extends PublicUserInfo {
    uid?: string
}

/**
 * This interface represents a user as it is stored in firebase-auth.
 * Private information is stored as a sub-collection which can only be accessed by the user that owns the information.
 */
export interface User {
    publicInfo?: PublicUserInfo;
    private?: {
        privateInfo?: PrivateUserInfo | undefined;
    }
};

