import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';
import { SHPEEvent, SHPEEventLog } from './types'
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { MillisecondTimes } from './timeUtils';

/**
 * Converts an angle in degrees to radians
 * @param angle 
 * @returns 
 */
const degreesToRadians = (angle: number): number => {
    return angle * Math.PI / 180;
}

/**
 * Calculates geographic distance of two geographic points in meters
 * @param pos1 First position with latitude and longitude
 * @param pos2 Second position with latitude and longitude
 * @returns Distance in meters on earth between two geographical coordinates
 * @reference https://en.wikipedia.org/wiki/Haversine_formula
 * @reference https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
 */
const geographicDistance = (pos1: GeoPoint, pos2: GeoPoint): number => {
    const EARTH_RADIUS = 6378142; // Approximate radius in meters
    const deltaLatitude = degreesToRadians(pos2.latitude - pos1.latitude);
    const deltaLongitude = degreesToRadians(pos2.longitude - pos1.longitude);

    const a = 0.5 - Math.cos(deltaLatitude) / 2 + Math.cos(degreesToRadians(pos1.latitude)) * Math.cos(degreesToRadians(pos2.latitude)) * (1 - Math.cos(deltaLongitude)) / 2;

    return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
}

/**
 * Handles a request from a user to sign into an event.
 */
export const eventSignIn = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data !== "object" || typeof data.eventID !== "string" || typeof data.location !== "object") {
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
    else if (event.geolocation && event.geofencingRadius && geographicDistance(event.geolocation, data.location) > event.geofencingRadius + 10) {
        throw new functions.https.HttpsError("out-of-range", `This event has geofencing enabled and the given user is not in range (${event.geofencingRadius / 1609} miles).`);
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
    } else if (typeof data !== "object" || typeof data.eventID !== "string" || typeof data.location !== "object") {
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
    else if (event.geolocation && event.geofencingRadius && geographicDistance(event.geolocation, data.location) > event.geofencingRadius + 10) {
        throw new functions.https.HttpsError("out-of-range", `This event has geofencing enabled and the given user is not in range (${event.geofencingRadius / 1609} miles).`);
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
