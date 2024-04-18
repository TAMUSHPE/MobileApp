import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';

export const calculateMOTM = functions.https.onCall(async (data, context) => {
    const pastMOTMIds: string[] = [];
    const pastMOTMSnapshot = await db.collection('member-of-the-month').doc('past-members').get();

    if (pastMOTMSnapshot.exists) {
        const pastMOTMData = pastMOTMSnapshot.data();
        if (pastMOTMData && Array.isArray(pastMOTMData.members)) {
            pastMOTMIds.push(...pastMOTMData.members);
        }
    }

    console.log("pastMOTMIds", pastMOTMIds);

    const eligibleUsersRef = db.collection('users')
        .where('roles.officer', '==', false)
        .where('roles.representative', '==', false)
        .orderBy('pointsThisMonth', 'desc');

    const eligibleUsersSnapshot = await eligibleUsersRef.get();
    const eligibleUsers: FirebaseFirestore.DocumentData[] = [];
    eligibleUsersSnapshot.forEach(doc => {
        if (!pastMOTMIds.includes(doc.id)) {
            eligibleUsers.push({ uid: doc.id, ...doc.data() });

        }
    });

    return eligibleUsers.slice(0, 5);
});