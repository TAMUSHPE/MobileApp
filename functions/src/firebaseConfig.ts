import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
const adminApp = initializeApp();

// Get instances of Firestore, Auth, and Storage from the Firebase Admin app
export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
export const bucket = getStorage(adminApp).bucket('gs://tamushpemobileapp.appspot.com');
