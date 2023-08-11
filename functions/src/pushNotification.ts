import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo,  ExpoPushMessage } from 'expo-server-sdk';

admin.initializeApp();

const db = admin.firestore();

const getOfficerTokens = async (officerUId: string) => {
    const privateInfoRef = db.doc(`users/${officerUId}/private/privateInfo`);
    const docSnap = await privateInfoRef.get();
    if (docSnap.exists) {
        return docSnap.data()?.expoPushTokens;
    } else {
      console.error("User does not exist");
      return null;
    }
};

const getAvailableOfficersTokens = async (): Promise<string[]> => {
    const signedInOfficersFCM: string[][] = [];
    const snapshot = await db.collection('office-hours/officers-status/officers').where('signedIn', '==', true).get();
    for(const doc of snapshot.docs){
        const data = doc.data();
        if (data.signedIn) {
            const token = await getOfficerTokens(doc.id);
            if(token) {
                signedInOfficersFCM.push(token);
            }
        }
    }
    return signedInOfficersFCM.flat();
};

const isExpoPushToken = (token: any): boolean => {
    return token && typeof token.data === 'string' && typeof token.type === 'string';
}

export const sendNotificationOfficeHours = functions.https.onCall(async (data, context) => {
    const expo = new Expo();
    const officerTokens = await getAvailableOfficersTokens();
    console.log(officerTokens);
    
    let messages: ExpoPushMessage[] = [];
    for (const pushToken of officerTokens) {
        if (!isExpoPushToken) {
            console.error("Token is not an ExpoPushToken");
        }
        // Token is stored as a stringified JSON object
        const parsedToken = JSON.parse(pushToken);
        messages.push({
          to:  parsedToken.data,
          sound: 'default',
          body: 'Someone at the door',
          data: { withSome: 'data' },
        });
    }
    let chunks = expo.chunkPushNotifications(messages);
    (async () => {
    for (let chunk of chunks) {
        try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        } catch (error) {
        console.error('Sent chunk error', error);
        }
    }
})();
});