import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, AuthProvider, AuthSettings, CompleteFn, Config, Dependencies, EmulatorConfig, ErrorFn, IdTokenResult, NextOrObserver, Persistence, PopupRedirectResolver, Unsubscribe, User, UserCredential, UserInfo, UserMetadata } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.GOOGLE_API_KEY,
    authDomain: "tamushpemobileapp.firebaseapp.com",
    projectId: "tamushpemobileapp",
    storageBucket: "tamushpemobileapp.appspot.com",
    messagingSenderId: "600060629240",
    appId: "1:600060629240:web:1e97e43973746bcc266b0d"
};

/**
 * Barebones implementation of Auth to work with unit tests.
 */
class MockAuth implements Auth {
    app: FirebaseApp;
    name: string;
    config: Config;
    settings: AuthSettings;
    languageCode: string | null;
    tenantId: string | null;
    currentUser: User | null;
    emulatorConfig: EmulatorConfig | null;

    async setPersistence(persistence: Persistence): Promise<void> { }

    onAuthStateChanged(nextOrObserver: NextOrObserver<User | null>, error?: ErrorFn | undefined, completed?: CompleteFn | undefined): Unsubscribe {
        return () => { };
    }

    beforeAuthStateChanged(callback: (user: User | null) => void | Promise<void>, onAbort?: (() => void) | undefined): Unsubscribe {
        return () => { };
    }

    onIdTokenChanged(nextOrObserver: NextOrObserver<User | null>, error?: ErrorFn | undefined, completed?: CompleteFn | undefined): Unsubscribe {
        return () => { };
    }

    async authStateReady(): Promise<void> { }

    updateCurrentUser(user: User | null): Promise<void> {
        return new Promise((resolve) => {
            this.currentUser = user;
            resolve()
        });
    }

    useDeviceLanguage(): void {
        this.languageCode = "en";
    }

    signOut(): Promise<void> {
        return new Promise((resolve) => {
            this.currentUser = null;
            resolve()
        });
    }

    constructor() {
        this.name = "Test User";
        this.languageCode = null;
        this.tenantId = null;
        this.currentUser = null;
        this.emulatorConfig = null;

        this.config = {
            apiKey: process.env.GOOGLE_API_KEY ?? "",
            apiHost: process.env.FIREBASE_EMULATOR_ADDRESS ?? "",
            apiScheme: "",
            tokenApiHost: process.env.FIREBASE_EMULATOR_ADDRESS ?? "",
            sdkClientVersion: ""
        };

        this.settings = {
            appVerificationDisabledForTesting: true
        };
        
        this.app = initializeApp(firebaseConfig);
    }
}

/**
 * Barebones implementation of a user class.
 * This can be extended to emulate users with different claims
 */
class MockUser implements User {
    emailVerified: boolean;
    isAnonymous: boolean;
    metadata: UserMetadata;
    providerData: UserInfo[];
    refreshToken: string;
    tenantId: string | null;

    async delete(): Promise<void> { }

    async getIdToken(forceRefresh?: boolean | undefined): Promise<string> {
        return "TESTIDTOKEN";
    }

    async getIdTokenResult(forceRefresh?: boolean | undefined): Promise<IdTokenResult> {
        return {
            authTime: new Date().toUTCString(),
            expirationTime: new Date('14 Jun 2070 00:00:00 PDT').toUTCString(),
            issuedAtTime: new Date().toUTCString(),
            signInProvider: null,
            signInSecondFactor: null,
            token: this.refreshToken,
            claims: {}
        }
    }

    async reload(): Promise<void> { }

    toJSON(): object {
        return {
            displayName: this.displayName,
            email: this.email,
            phoneNumber: this.phoneNumber,
            photoURL: this.photoURL,
            providerId: this.providerId,
            uid: this.uid,
        }
    }

    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;

    constructor() {
        this.emailVerified = true;
        this.isAnonymous = false;
        this.metadata = {};
        this.providerData = [this];
        this.refreshToken = "";
        this.tenantId = null;
        this.displayName = "Test User";
        this.email = "test@test.com";
        this.phoneNumber = null;
        this.photoURL = null;
        this.providerId = "TEST";
        this.uid = "ABCD1234";
    }
}

class MockAdminUser extends MockUser {
    async getIdTokenResult(forceRefresh?: boolean | undefined): Promise<IdTokenResult> {
        return {
            authTime: new Date().toUTCString(),
            expirationTime: new Date('14 Jun 2070 00:00:00 PDT').toUTCString(),
            issuedAtTime: new Date().toUTCString(),
            signInProvider: null,
            signInSecondFactor: null,
            token: this.refreshToken,
            claims: {
                admin: true
            }
        }
    }
}

const initializeAuth = jest.fn((app?: FirebaseApp, deps?: Dependencies | undefined): Auth => {
    const auth = new MockAuth();
    if (app) {
        auth.app = app;
    }
    return auth;
});

const getAuth = jest.fn((app?: FirebaseApp): Auth => {
    return initializeAuth(app);
});

const connectAuthEmulator = jest.fn((auth: Auth, url: string, options?: { disableWarnings: boolean; }): void => { });

const signIn = jest.fn(async (auth: Auth): Promise<UserCredential> => {
    const user = new MockUser();

    auth.updateCurrentUser(user);

    return {
        user,
        providerId: null,
        operationType: "signIn"
    }
});

const signInWithPopup = jest.fn((auth: Auth, provider: AuthProvider, resolver?: PopupRedirectResolver | undefined): Promise<UserCredential> => {
    return signIn(auth);
});

const signInAnonymously = jest.fn(signIn);

const deleteUser = jest.fn(async (user: User): Promise<void> => { });

export {
    getAuth,
    initializeAuth,
    signInWithPopup,
    signInAnonymously,
    connectAuthEmulator,
    deleteUser
};