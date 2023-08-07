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
    const snapshot = await db.collection('office-hours/officers-status/officers').where('signedIn', '==', true).get();
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

export const sendNotificationOfficeHours = functions.https.onCall(async (data, context) => {
    try {
        const officerFCMTokenLists = await getAvailableOfficersFCMToken();
        const officerFCMTokens = officerFCMTokenLists.flat();
        console.log(officerFCMTokens);

        const response = await admin.messaging().sendMulticast({
            tokens: officerFCMTokens,
            notification: {
                title: data.title,
                body: data.body,
            },
        });

        const failedTokens:string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(officerFCMTokens[idx]);
            }
        });

        if (failedTokens.length === 0) {
            console.log("Notification sent successfully to all tokens.");
            return { success: true, failedTokens: [] };
        } else {
            console.error("Notification failed for some tokens.");
            return { success: false, failedTokens: failedTokens };
        }
    } catch (error) {
        console.error("Error sending notification:", error);
        throw new functions.https.HttpsError("internal", "Failed to send the notification.");
    }
});