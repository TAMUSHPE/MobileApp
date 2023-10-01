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

export const incrementCommitteesCount = functions.https.onCall(async (data, context) => {
    const { committeeNames } = data; 
    
    if (!Array.isArray(committeeNames)) {
        throw new functions.https.HttpsError('invalid-argument', 'committeeNames must be an array.');
    }
    
    const updatePromises = committeeNames.map((committeeName) => {
        console.log(committeeName)
        const committeeRef = db.doc(`committees/${committeeName}`);
        return committeeRef.update({ memberCount: admin.firestore.FieldValue.increment(1) })
            .catch((error) => {
                console.error(`Update failure for committee ${committeeName}:`, error);
            });
    });
    try {
        console.log("starting update")
        await Promise.all(updatePromises);
        return { success: true };
    } catch (error) {
        console.error('Update failure:', error);
        throw new functions.https.HttpsError('internal', 'Could not update committee count.');
    }
});

export const updateCommitteesCount = functions.https.onCall(async (data, context) => {
    const { changes } = data;

    if (!Array.isArray(changes)) {
        throw new functions.https.HttpsError('invalid-argument', 'changes must be an array.');
    }

    const updatePromises = changes.map((change) => {
        const committeeRef = db.doc(`committees/${change.firebaseDocName}`);
        return committeeRef.update({
            memberCount: admin.firestore.FieldValue.increment(change.change),
        })
        .catch((error) => {
            console.error(`Update failure for committee ${change.firebaseDocName}:`, error);
        });
    });

    try {
        await Promise.all(updatePromises);
        return { success: true };
    } catch (error) {
        console.error('Update failure:', error);
        throw new functions.https.HttpsError('internal', 'Could not update committee count.');
    }
});

