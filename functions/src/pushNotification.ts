import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

/**
 * Fetches the Expo push tokens of a specific officer.
 *
 * @param officerUId The unique ID of the officer.
 * @returns An array of push tokens or null if the user does not exist.
 */
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

/**
 * Fetches the push tokens of all officers who are currently signed in.
 *
 * @returns A promise that resolves with an array of push tokens for signed-in officers.
 */
const getAvailableOfficersTokens = async (): Promise<string[]> => {
    const signedInOfficersTokens: string[] = [];   
    const snapshot = await db.collection('office-hours/officers-status/officers').where('signedIn', '==', true).get();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.signedIn) {
            const tokens = await getOfficerTokens(doc.id);
            if (tokens) {
                signedInOfficersTokens.push(...tokens);
            }
        }
    }

    return signedInOfficersTokens;
};

/**
 * Checks if a provided token conforms to the structure of an Expo push token.
 *
 * @param token The token to check.
 * @returns True if the token conforms to the Expo push token structure, false otherwise.
 */ 
const isExpoPushToken = (token: any): boolean => {
    return token && typeof token.data === 'string' && typeof token.type === 'string';
}

/** Sends notifications to all signed-in officers. */
export const sendNotificationOfficeHours = functions.https.onCall(async (data, context) => {
    const expo = new Expo();
    const officerTokens = await getAvailableOfficersTokens();
    
    const messages: ExpoPushMessage[] = [];
    for (const pushToken of officerTokens) {
        if (!isExpoPushToken) {
            console.error("Token is not an ExpoPushToken");
            continue;
        }
        const parsedToken = JSON.parse(pushToken);
        messages.push({
            to: parsedToken.data,
            sound: 'default',
            body: 'Someone at the door',
            data: { withSome: 'data' },
        });
    }

    const chunks = expo.chunkPushNotifications(messages);
    (async () => {
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
            } catch (error) {
                console.error('Sent chunk error', error);
            }
        }
    })();
});