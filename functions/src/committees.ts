import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"
import * as admin from 'firebase-admin';


export const updateCommitteeCount = functions.https.onCall(async (data, context) => {
    const { committeeName, change } = data; 

    if (change !== 1 && change !== -1) {
        throw new functions.https.HttpsError('invalid-argument', 'Change value must be 1 or -1.');
    }

    const committeeRef = db.doc(`committees/${committeeName}`); 

    try {
        await committeeRef.update({ memberCount: admin.firestore.FieldValue.increment(change) });
        return { success: true };
    } catch (error) {
        console.error('Update failure:', error);
        throw new functions.https.HttpsError('internal', 'Could not update committee count.');
    }
});