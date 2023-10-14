/** Scheduled function to reset officer count at 5AM CST */
import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"

export const resetOffice = functions.pubsub.schedule('0 5 * * *').timeZone('America/Chicago').onRun(async (context) => {
    const setOfficer = db.doc(`office-hours/officer-count`);
    const officersRef = db.doc('office-hours/officers-status/officers').collection('officers');
    try{
        await setOfficer.update({'zachary-office': 0});
        // fetch all officers
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
});

export const testReset = functions.https.onCall(async (context) => {
    const setOfficer = db.doc(`office-hours/officer-count`);
    const officersRef = db.doc('office-hours/officers-status/officers').collection('officers');
    try{
        await setOfficer.update({'zachary-office': 0});
        // fetch all officers
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
});