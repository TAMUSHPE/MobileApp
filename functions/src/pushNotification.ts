import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { SHPEEvent } from './types/events';
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

    return docSnap.data()?.expoPushTokens || [];
};

/**
 * Fetches the push tokens of all officers who are currently signed in.
 *
 * @returns A promise that resolves with an array of push tokens for signed-in officers.
 */
const getAvailableOfficersTokens = async (): Promise<string[]> => {
    const signedInOfficersTokens: string[] = [];
    const snapshot = await db.collection('office-hours').get();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.signedIn) {
            const tokens = await getMemberTokens(doc.id);
            if (tokens) {
                signedInOfficersTokens.push(...tokens);
            }
        }
    }

    console.log(signedInOfficersTokens, 'SignedInOfficerTokens');

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


export const notifyUpcomingEvents = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    console.log('Running Event Notification Sent');
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const eventsToNotify = await db.collection('events')
        .where('startTime', '>=', now)
        .where('startTime', '<=', oneHourLater)
        .where('notificationSent', '!=', true)
        .get();


    for (const eventDoc of eventsToNotify.docs) {
        const event = eventDoc.data() as SHPEEvent;
        const eventNotificationTargets = await determineEventNotificationTargets(event);

        if (eventNotificationTargets.length > 0) {
            await sendEventNotification(eventNotificationTargets, event);
        }

        await eventDoc.ref.update({ notificationSent: true });
    }
});

async function determineEventNotificationTargets(event: SHPEEvent): Promise<string[]> {
    const allTokens: Set<string> = new Set();
    const processedUserIds: Set<string> = new Set();

    // Case 1: Club-wide event
    if (event.general) {
        const allMembersSnapshot = await db.collection('users').get();
        for (const doc of allMembersSnapshot.docs) {
            const tokens = await getMemberTokens(doc.id);
            tokens.forEach((token: string) => allTokens.add(token));
        }
        return Array.from(allTokens);
    }

    // Case 2: Event associated with a committee
    if (event.committee && event.committee !== "") {
        const committeeMembersSnapshot = await db.collection('users').where('committees', 'array-contains', event.committee).get();
        for (const doc of committeeMembersSnapshot.docs) {
            if (!processedUserIds.has(doc.id)) {
                const tokens = await getMemberTokens(doc.id);
                tokens.forEach((token: string) => allTokens.add(token));
                processedUserIds.add(doc.id);
            }
        }
    }

    // Case 3: Notify users based on their interests
    const eventType = event.eventType as string;
    if (["Study Hours", "Workshop", "Volunteer Event", "Social Event", "Intramural Event"].includes(eventType)) {
        const interestedUsersSnapshot = await db.collection('users').where('interests', 'array-contains', event.eventType).get();
        for (const doc of interestedUsersSnapshot.docs) {
            if (!processedUserIds.has(doc.id)) {
                const tokens = await getMemberTokens(doc.id);
                tokens.forEach((token: string) => allTokens.add(token));
                processedUserIds.add(doc.id);
            }
        }
    }

    return Array.from(allTokens);
}

async function sendEventNotification(tokens: string[], event: SHPEEvent) {
    const expo = new Expo();
    const messages: ExpoPushMessage[] = [];

    tokens.forEach((tokenString: string) => {
        let token;
        try {
            const tokenObj = JSON.parse(tokenString);
            token = tokenObj.data;
        } catch (error) {
            console.error(`Error parsing token string: ${tokenString}`, error);
            return;
        }

        if (!Expo.isExpoPushToken(token)) {
            console.error(`Push token ${token} is not a valid Expo push token`);
            return; // Skip this token
        }

        messages.push({
            to: token,
            sound: 'default',
            title: event?.name || "Event",
            body: `Reminder: ${event.name} is starting soon!`,
            data: { event },
        });
    });

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Notification tickets', ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error('Error sending notifications', error);
        }
    }
}
