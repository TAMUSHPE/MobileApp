import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

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

const getAvailableOfficersFCMToken = async (): Promise<string[]> => {
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
};

// This is for testing only
export const getAvailableOfficersTest = functions.https.onCall(async (data, context) => {
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

export const sendNotificationOfficeHours = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }

    const officerFCMTokenLists = await getAvailableOfficersFCMToken();
    const officerFCMTokens = officerFCMTokenLists.flat();

    const notificationContent = {
      notification: {
        title: data.title,
        body: data.body,
      },
      token: officerFCMTokens
    };

    admin.messaging().sendEachForMulticast({
        tokens: officerFCMTokens,
        notification: notificationContent.notification,
    })
    console.log("Notification sent")
  });