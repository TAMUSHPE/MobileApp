import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, FirebaseApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
import { getStorage } from "firebase/storage";


const firebaseConfig = {
    apiKey: process.env.GOOGLE_API_KEY,
    authDomain: "tamushpemobileapp.firebaseapp.com",
    projectId: "tamushpemobileapp",
    storageBucket: "tamushpemobileapp.appspot.com",
    messagingSenderId: "600060629240",
    appId: "1:600060629240:web:1e97e43973746bcc266b0d"
};

// IOS OAuth: 600060629240-m7bu9ba9namtlmo9sii2s8qs2j9k5bt4.apps.googleusercontent.com
// Android OAuth: 600060629240-bdfsdcfmbrjh5skdc9qufchrmcnm26fb.apps.googleusercontent.com

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // For jest unit tests, getReactNativePersistence is not defined.
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence ? getReactNativePersistence(AsyncStorage) : undefined,
    });
}
else {
    app = getApp();
    auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { db, auth, storage, functions };
