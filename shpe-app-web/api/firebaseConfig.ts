import { initializeApp, FirebaseApp, getApp, getApps } from 'firebase/app';
import { getAuth, Auth, initializeAuth, signInWithPopup, signOut, GoogleAuthProvider, User } from "firebase/auth";
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

let app: FirebaseApp;
// let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // auth = initializeAuth(app);
}
else {
    app = getApp();
    // auth = getAuth(app);
}

const auth = getAuth(app)
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { db, auth, storage, functions };
