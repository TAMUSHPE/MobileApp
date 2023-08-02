
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
// import { getAvailableOfficersFCMToken } from "./pushNotification";
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();


export const helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase!");
});

const getOfficerFCMToken = async (officerUId: string) => {
    const privateInfoRef = db.doc(`users/${officerUId}/private/privateInfo`);
    const docSnap = await privateInfoRef.get();
    if (docSnap.exists) {
      return docSnap.data()?.fcmTokens ?? null;
    } else {
      console.log("No user");
      return null;
    }
};

export const getAvailableOfficersFCMToken = functions.https.onCall(async (data, context) => {
    const signedInOfficersFCM: string[] = [];
    const snapshot = await db.collection('office-hour/officers-status/officers').where('signedIn', '==', true).get();
    for(const doc of snapshot.docs){
        const data = doc.data();
        if (data.signedIn) {
            const token = await getOfficerFCMToken(doc.id);
            if(token) {
                signedInOfficersFCM.push(token);
            }
        }
    }
    return signedInOfficersFCM;
});