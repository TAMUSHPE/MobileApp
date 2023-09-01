import { initializeApp, FirebaseApp, getApp, getApps } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "***REMOVED***",
    authDomain: "tamushpemobileapp.firebaseapp.com",
    projectId: "tamushpemobileapp",
    storageBucket: "tamushpemobileapp.appspot.com",
    messagingSenderId: "600060629240",
    appId: "1:600060629240:web:1e97e43973746bcc266b0d"
};

// IOS OAuth: 600060629240-m7bu9ba9namtlmo9sii2s8qs2j9k5bt4.apps.googleusercontent.com
// Android OAuth: 600060629240-bdfsdcfmbrjh5skdc9qufchrmcnm26fb.apps.googleusercontent.com

let app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
