/** Scheduled function to reset officer count at 5AM CST */
import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"


const resetOffice = async () => {
    const setOfficer = db.doc(`office-hours/officer-count`);
    const officersRef = db.collection('office-hours/officers-status/officers');

    try{
        await setOfficer.update({'zachary-office': 0});
        officersRef.get().then(async (snapshot) => {
            snapshot.forEach(doc => {
                doc.ref.update({
                    signIn: false,
                });
            });
        });
        return { success: true };
    }
    catch (error) {
        console.error('Update failure:', error);
        throw new functions.https.HttpsError('internal', 'Could not reset officer count');
    }

}

export const resetOfficeScheduler = functions.pubsub.schedule('0 19 * * *') .onRun(async (context) => {
    resetOffice()
});

export const resetOfficeOnCall = functions.https.onCall(async (data, context) => {
    resetOffice()

});