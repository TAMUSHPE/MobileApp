import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig";

export const checkUsernameUniqueness = functions.https.onCall(async (data, context) => {
    const username = data.username;
    if (typeof username !== 'string' || username.trim() === '') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a non-empty "username" string.');
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('displayName', '==', username.trim()).limit(1).get();

    // Return whether the username is unique
    return { unique: snapshot.empty };
});
