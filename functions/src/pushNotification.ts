import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

/**
 * Fetches the Expo push tokens of a member.
 *
 * @param uid The unique ID of the member.
 * @returns An array of push tokens or null if the user does not exist.
 */
const getMemberTokens = async (uid: string) => {
    console.log("Getting tokens for", uid)

    const privateInfoRef = db.doc(`users/${uid}/private/privateInfo`);
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
            const tokens = await getMemberTokens(doc.id);
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
// const isExpoPushToken = (token: any): boolean => {
//     return token && typeof token.data === 'string' && typeof token.type === 'string';
// }

/** Sends notifications to all signed-in officers.
 *  https://github.com/expo/expo-server-sdk-node
 */

export const sendNotificationOfficeHours = functions.https.onCall(async (data, context) => {
    const userData = data.userData;
    const expo = new Expo();
    const officerTokens = await getAvailableOfficersTokens();

    if (userData === null || userData === undefined) {
        return;
    }

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of officerTokens) {
        const parsedToken = JSON.parse(pushToken);
        messages.push({
            to: parsedToken.data,
            sound: 'default',
            title: "Knock on Wall",
            body: `${userData.name} is at the door!`,
            data: { userData: userData },
        });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
        } catch (error) {
            console.error('Sent chunk error', error);
        }
    }
});

/**
 * This will be used both to send notification to member that was approve/deny and this will also be used
 * to resync the member's data in the app.
 */
export const sendNotificationMemberSHPE = functions.https.onCall(async (data, context) => {
    const notificationType = data.type;
    const uid = data.uid;
    const memberTokens = await getMemberTokens(uid);

    const expo = new Expo();
    const messages: ExpoPushMessage[] = [];
    for (const expoToken of memberTokens) {
        const parsedToken = JSON.parse(expoToken);
        messages.push({
            to: parsedToken.data,
            sound: 'default',
            title: "Membership Update",
            body: `Your membership status has been ${notificationType}`,
            data: { type: notificationType },
        });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
        } catch (error) {
            console.error('Error sending chunk:', error);
        }
    }
});

export const sendNotificationCommitteeRequest = functions.https.onCall(async (data, context) => {
    const notificationType = data.type;
    const committeeName = data.committeeName;
    const uid = data.uid;
    const memberTokens = await getMemberTokens(uid);

    const expo = new Expo();
    const messages: ExpoPushMessage[] = [];
    for (const expoToken of memberTokens) {
        const parsedToken = JSON.parse(expoToken);
        messages.push({
            to: parsedToken.data,
            sound: 'default',
            title: "Committee Membership Update",
            body: `Your ${committeeName} membership status has been ${notificationType}`,
            data: { type: notificationType },
        });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
        } catch (error) {
            console.error('Error sending chunk:', error);
        }
    }
});

/**
 * This will be used both to send notification to member that was approve/deny and this will also be used
 * to resync the member's data in the app.
 */
export const sendNotificationResumeConfirm = functions.https.onCall(async (data, context) => {
    const notificationType = data.type;
    const uid = data.uid;
    const memberTokens = await getMemberTokens(uid);

    const expo = new Expo();
    const messages: ExpoPushMessage[] = [];
    for (const expoToken of memberTokens) {
        const parsedToken = JSON.parse(expoToken);
        messages.push({
            to: parsedToken.data,
            sound: 'default',
            title: "Resume Bank",
            body: `Your resume has been ${notificationType}`,
            data: { type: notificationType },
        });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
        } catch (error) {
            console.error('Error sending chunk:', error);
        }
    }
});

