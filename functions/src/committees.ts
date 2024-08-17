import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig";

async function updateCommitteeCounts() {
    const committeesCount: CommitteeCounts = {};

    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    usersSnapshot.forEach(doc => {
        const userData = doc.data();
        userData.committees?.forEach((committee: string) => {
            if (!committeesCount[committee]) {
                committeesCount[committee] = 0;
            }
            committeesCount[committee]++;
        });
    });

    for (const [committeeName, count] of Object.entries(committeesCount)) {
        const committeeRef = db.doc(`committees/${committeeName}`);
        await committeeRef.update({ memberCount: count });
    }

    console.log('Committee counts updated:', committeesCount);
    return { message: 'Committee counts updated successfully', committeesCount };
}

export const updateCommitteeCount = functions.https.onCall(async (data, context) => {
    return updateCommitteeCounts();
});

export const scheduleCommitteeCount = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    return updateCommitteeCounts();
});

interface CommitteeCounts {
    [key: string]: number;
}
