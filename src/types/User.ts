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
 * This interface represents a user's public information as it is stored in firestore.
 * This information is accessible by anyone in the app.
 * Each argument must have a value, however some of these values may be "empty". For example, if a string's value is "", this means that there is no value in the data.
 */
export interface PublicUserInfo {
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
};

/**
 * This interface represents the settings for the application. Different sliders and values will be added to this over time.
 */
export interface AppSettings {
    darkMode: boolean;
}

/**
 * This interface represents a user's private information as it is stored in firestore. This information should only be visible to the user that owns it.
 */
export interface PrivateUserInfo {
    completedAccountSetup?: boolean;
    settings?: AppSettings;
    expoPushTokens?: string[];
};

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
