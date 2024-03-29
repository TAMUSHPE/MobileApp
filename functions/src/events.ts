import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';
import { SHPEEvent, SHPEEventLog } from './types'
import { Timestamp } from 'firebase-admin/firestore';
import { MillisecondTimes } from './timeUtils';

/**
 * Handles a request from a user to sign into an event.
 */
export const eventSignIn = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data !== "object" || typeof data.eventID !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const eventDocRef = db.collection("events").doc(data.eventID);
    const event: SHPEEvent | undefined = (await eventDocRef.get()).data();
    if (typeof event !== "object") {
        throw new functions.https.HttpsError("not-found", `Event with id ${data.eventID} could not be found`);
    }

    // Used to check if user has already signed into event
    const eventLogDocRef = db.collection(`events/${data.eventID}/logs`).doc(context.auth.uid);
    const eventLog: SHPEEventLog = (await eventLogDocRef.get()).data() ?? {
        uid: context.auth.uid,
        eventId: eventDocRef.id,
        creationTime: Timestamp.fromMillis(Date.now()),
        verified: true,
    };

    if (eventLog !== undefined && eventLog.signInTime !== undefined) {
        throw new functions.https.HttpsError("already-exists", "Sign in time already exists.");
    }
    else if (event.endTime && (event.endTime.toMillis() + (event.endTimeBuffer ?? 0)) < Date.now()) {
        throw new functions.https.HttpsError("deadline-exceeded", "Event has already ended.");
    }
    else if (event.startTime && (event.startTime.toMillis() - (event.endTimeBuffer ?? 0) > Date.now())) {
        throw new functions.https.HttpsError("failed-precondition", "Event has not started.")
    }

    eventLog.signInTime = Timestamp.fromMillis(Date.now());

    switch (event.eventType) {
        case undefined:
            throw new functions.https.HttpsError("internal", "Event type is undefined. This means that an issue has occurred during event creation/updating.");
        case null:
            throw new functions.https.HttpsError("internal", "Event type is null. This means that an issue has occurred during event creation/updating.");
        default:
            eventLog.points = (eventLog.points ?? 0) + (event.signInPoints ?? 0);
            break;
    }

    // Sets log in both event and user collection and ensures both happen by the end of the function. 
    await eventLogDocRef.set(eventLog, { merge: true });
    await db.collection(`users/${context.auth.uid}/event-logs`).doc(data.eventID).set(eventLog, { merge: true });

    return { success: true };
});


/**
 * Handles a request from a user to sign out of an event.
 */
export const eventSignOut = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data !== "object" || typeof data.eventID !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const eventDocRef = db.collection("events").doc(data.eventID);
    const event: SHPEEvent | undefined = (await eventDocRef.get()).data();
    if (typeof event !== "object") {
        throw new functions.https.HttpsError("not-found", `Event with id ${data.eventID} could not be found`);
    }

    // Used to check if user has already signed into event
    const eventLogDocRef = db.collection(`events/${data.eventID}/logs`).doc(context.auth.uid);
    const eventLog: SHPEEventLog = (await eventLogDocRef.get()).data() ?? {
        uid: context.auth.uid,
        eventId: eventDocRef.id,
        creationTime: Timestamp.fromMillis(Date.now()),
        verified: true,
    };

    if (eventLog !== undefined && eventLog.signOutTime !== undefined) {
        throw new functions.https.HttpsError("already-exists", "Sign out time already exists.");
    }
    else if (event.endTime && (event.endTime.toMillis() + (event.endTimeBuffer ?? 0)) < Date.now()) {
        throw new functions.https.HttpsError("deadline-exceeded", "Event has already ended.");
    }
    else if (event.startTime && (event.startTime.toMillis() - (event.endTimeBuffer ?? 0) > Date.now())) {
        throw new functions.https.HttpsError("failed-precondition", "Event has not started.")
    }

    eventLog.signOutTime = Timestamp.fromMillis(Date.now());
    let accumulatedPoints = 0;

    switch (event.eventType) {
        case "Study Hours":
            if (eventLog.signInTime && eventLog.signInTime.toMillis() < eventLog.signOutTime.toMillis()) {
                accumulatedPoints = (eventLog.signOutTime.toMillis() - eventLog.signInTime.toMillis()) / MillisecondTimes.HOUR * (event.pointsPerHour ?? 0);
            }
            eventLog.points = (eventLog.points ?? 0) + (event.signOutPoints ?? 0) + accumulatedPoints;
            break;
        case "Volunteer Event":
            if (eventLog.signInTime && eventLog.signInTime.toMillis() < eventLog.signOutTime.toMillis()) {
                accumulatedPoints = Math.floor((eventLog.signOutTime.toMillis() - eventLog.signInTime.toMillis()) / MillisecondTimes.HOUR) * (event.pointsPerHour ?? 0);
            }
            eventLog.points = (eventLog.points ?? 0) + (event.signOutPoints ?? 0) + accumulatedPoints;
            break;
        case undefined:
            throw new functions.https.HttpsError("internal", "Event type is undefined. This means that an issue has occurred during event creation/updating.");
        case null:
            throw new functions.https.HttpsError("internal", "Event type is null. This means that an issue has occurred during event creation/updating.");
        default:
            eventLog.points = (eventLog.points ?? 0) + (event.signOutPoints ?? 0);
            break;
    }

    // Sets log in both event and user collection and ensures both happen by the end of the function. 
    await eventLogDocRef.set(eventLog, { merge: true });
    await db.collection(`users/${context.auth.uid}/event-logs`).doc(data.eventID).set(eventLog, { merge: true });

    return { success: true };
});
