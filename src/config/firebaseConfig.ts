import firebase from 'firebase/compat/app';
import "firebase/compat/auth";
import "firebase/compat/firestore";
// import "firebase/compat/database";
// import "firebase/compat/functions";
// import "firebase/compat/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAGTrXfkTWKNACHcxU4KboqMN6E8JAobaQ",
    authDomain: "shpe-app-testing.firebaseapp.com",
    projectId: "shpe-app-testing",
    storageBucket: "shpe-app-testing.appspot.com",
    messagingSenderId: "375063934797",
    appId: "1:375063934797:web:32f63de392a6e10c8e2904"
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

export { db, auth };
