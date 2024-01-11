import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig";


export const isUserInBlacklist = functions.https.onCall(async (data, context) => {
    const uid = data.uid;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "uid".');
    }
    console.log(`Checking if user ${uid} is in the blacklist...`);

    try {
        const blacklistDocRef = db.doc("restrictions/blacklist");
        const docSnap = await blacklistDocRef.get();

        // Check if the document exists and has data
        if (docSnap.exists && docSnap.data()) {
            const blacklist = docSnap.data()?.list;
            return { isInBlacklist: Array.isArray(blacklist) && blacklist.some(user => user.uid === uid) };
        } else {
            // Blacklist document does not exist or has no data
            return { isInBlacklist: false };
        }
    } catch (error) {
        throw new functions.https.HttpsError('unknown', 'An error occurred while checking the blacklist', error);
    }
});