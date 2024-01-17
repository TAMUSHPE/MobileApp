import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"
import * as admin from 'firebase-admin';

export const updateCommitteeMembersCount = functions.https.onCall(async (data, context) => {
    const { committeeChanges } = data;

    if (!Array.isArray(committeeChanges)) {
        throw new functions.https.HttpsError('invalid-argument', 'committeeChanges must be an array.');
    }

    const updatePromises = committeeChanges.map((change) => {
        if (typeof change.committeeName !== 'string' || typeof change.change !== 'number') {
            throw new functions.https.HttpsError('invalid-argument', 'Each change must have a committeeName and change.');
        }

        const committeeRef = db.doc(`committees/${change.committeeName}`);
        return committeeRef.update({ 
            memberCount: admin.firestore.FieldValue.increment(change.change) 
        })
        .catch((error) => {
            console.error(`Update failure for committee ${change.committeeName}:`, error);
        });
    });

    try {
        await Promise.all(updatePromises);
        return { success: true };
    } catch (error) {
        console.error('Update failure:', error);
        throw new functions.https.HttpsError('internal', 'Could not update committee member counts.');
    }
});


export const committeeCountCheck = functions.pubsub.schedule('every saturday 00:00')
    .timeZone('America/Chicago') // Set your time zone
    .onRun(async (context) => {
        const committeesCount: CommitteeCounts = {};

        const usersSnapshot = await db.collection('users').get();

        usersSnapshot.forEach(doc => {
            const userData = doc.data();

            userData.committees?.forEach((committee:string) => {
                if (!committeesCount[committee]) {
                    committeesCount[committee] = 0;
                }
                committeesCount[committee]++;
            });
        });

        await db.collection('committees').doc('committeeCounts').set(committeesCount);

        console.log('Committee counts updated:', committeesCount);
});

export const committeeCountCheckOnCall = functions.https.onCall(async (data, context) => {
    const committeesCount: CommitteeCounts = {};

    const usersSnapshot = await db.collection('users').get();

    usersSnapshot.forEach(doc => {
        const userData = doc.data();

        userData.committees?.forEach((committee: string) => {
            if (!committeesCount[committee]) {
                committeesCount[committee] = 0;
            }
            committeesCount[committee]++;
        });
    });

    await db.collection('committees').doc('committeeCounts').set(committeesCount);

    console.log('Committee counts updated:', committeesCount);
    return { message: 'Committee counts updated successfully', committeesCount };
});

interface CommitteeCounts {
    [key: string]: number;
}

