/** Scheduled function to reset officer count at 5AM CST */
import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"

const resetOffice = async () => {
    const officersRef = db.collection('office-hours');

    try {
        const snapshot = await officersRef.get();
        const updatePromises = snapshot.docs.map((doc) =>
            doc.ref.update({
                signedIn: false,
            })
        );

        await Promise.all(updatePromises);
        return { success: true };
    } catch (error) {
        console.error('Update failure:', error);
        throw new functions.https.HttpsError('internal', 'Could not reset officer statuses');
    }
};

export const resetOfficeScheduler = functions.pubsub.schedule('0 2 * * *').onRun(async (context) => {
    resetOffice();
});


export const resetOfficeOnCall = functions.https.onCall(async (data, context) => {
    resetOffice()

});