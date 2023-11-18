import * as admin from 'firebase-admin';

admin.initializeApp();
export const db = admin.firestore();
export const auth = admin.auth();
export const bucket = admin.storage().bucket('gs://tamushpemobileapp.appspot.com');