import firebase from 'firebase/compat/app';
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { getStorage } from "firebase/storage";
// import "firebase/compat/database";
// import "firebase/compat/functions";
// import "firebase/compat/storage";

const firebaseConfig = {
    apiKey: "***REMOVED***",
    authDomain: "tamushpemobileapp.firebaseapp.com",
    projectId: "tamushpemobileapp",
    storageBucket: "tamushpemobileapp.appspot.com",
    messagingSenderId: "600060629240",
    appId: "1:600060629240:web:1e97e43973746bcc266b0d"
};


let app: firebase.app.App;
if (firebase.apps.length === 0) {
    app = firebase.initializeApp(firebaseConfig);
}
else {
    app = firebase.app();
}

const db = app.firestore();
const auth = firebase.auth();
const storage = getStorage(app);

export { db, auth, storage };
