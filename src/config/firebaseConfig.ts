import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, FirebaseApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth, connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from "firebase/storage";


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

    // Non react-native environments do not define getReactNativePersistence
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

// if (process.env.FIREBASE_EMULATOR_ADDRESS !== undefined) {
//     const address = process.env.FIREBASE_EMULATOR_ADDRESS;
//     console.debug("Connecting to firebase emulators.");
//     if(process.env.FIREBASE_AUTH_PORT !== undefined){
//         connectAuthEmulator(auth, `http://${address}:${process.env.FIREBASE_AUTH_PORT}`);
//     }
//     if(process.env.FIREBASE_FIRESTORE_PORT !== undefined){
//         connectFirestoreEmulator(db, address, Number(process.env.FIREBASE_FIRESTORE_PORT));
//     }
//     if(process.env.FIREBASE_CLOUD_FUNCTIONS_PORT !== undefined){
//         connectFunctionsEmulator(functions, address, Number(process.env.FIREBASE_CLOUD_FUNCTIONS_PORT));
//     }
//     if(process.env.FIREBASE_STORAGE_PORT !== undefined){
//         connectStorageEmulator(storage, address, Number(process.env.FIREBASE_STORAGE_PORT));
//     }
// }

export { db, auth, storage, functions };
