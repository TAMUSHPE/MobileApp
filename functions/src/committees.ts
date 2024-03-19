import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"

export const committeeCountCheck = functions.pubsub.schedule('every saturday 00:00')
    .timeZone('America/Chicago') // Set your time zone
    .onRun(async (context) => {
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

