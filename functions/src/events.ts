import * as functions from 'firebase-functions';
import { db } from './firebaseConfig';
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { SHPEEvent, SHPEEventLog } from './types/events'
import { MillisecondTimes } from './helpers/timeUtils';

/**
 * Converts an angle in degrees to radians
 * @param angle 
 * @returns given degree angle in radians
 */
const degreesToRadians = (angle: number): number => {
    return angle * Math.PI / 180;
}

/**
 * Calculates an approximation of geographic distance of two geographic points in meters
 * @param pos1 First position with latitude and longitude
 * @param pos2 Second position with latitude and longitude
 * @returns Distance in meters on earth between two geographical coordinates
 * @reference https://community.esri.com/t5/coordinate-reference-systems-blog/distance-on-a-sphere-the-haversine-formula/ba-p/902128
 * @reference https://en.wikipedia.org/wiki/Haversine_formula
 * @reference https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
 */
const geographicDistance = (pos1: GeoPoint, pos2: GeoPoint): number => {
    const EARTH_RADIUS = 6378142; // Approximate radius in meters

    const phi1 = degreesToRadians(pos1.latitude);
    const phi2 = degreesToRadians(pos2.latitude);

    const deltaPhi = degreesToRadians(pos2.latitude - pos1.latitude);
    const deltaLambda = degreesToRadians(pos2.longitude - pos1.longitude);

    const a = (Math.sin(deltaPhi / 2.0) ** 2) + Math.cos(phi1) * Math.cos(phi2) * (Math.sin(deltaLambda / 2.0) ** 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c;
}

/**
 * Meters that are acceptable to be beyond the geofencing bubble.
 * This deals with bad geolocation data that assumes people are further away from their actual physical location
 */
const ACCEPTABLE_DISTANCE_ERROR = 20;

/**
 * Handles a request from a user to sign into an event.
 */
export const eventSignIn = functions.https.onCall(async (data, context) => {
    const uid = data.uid || context.auth?.uid;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data !== "object" || typeof data.eventID !== "string" || typeof data.location !== "object") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const eventDocRef = db.collection("events").doc(data.eventID);
    const event: SHPEEvent | undefined = (await eventDocRef.get()).data();
    if (typeof event !== "object") {
        const message = `Event with id ${data.eventID} could not be found`;
        functions.logger.log(message);
        throw new functions.https.HttpsError("not-found", message);
    }

    // Used to check if user has already signed into event
    const eventLogDocRef = db.collection(`events/${data.eventID}/logs`).doc(uid);
    const eventLog: SHPEEventLog = (await eventLogDocRef.get()).data() ?? {
        uid: uid,
        eventId: eventDocRef.id,
        creationTime: Timestamp.fromMillis(Date.now()),
        verified: true,
    };

    // Check for any possible errors on the user's part
    if (eventLog !== undefined && eventLog.signInTime !== undefined) {
        functions.logger.error(`User ${uid} attempted sign-in again`);
        throw new functions.https.HttpsError("already-exists", "Sign in time already exists.");
    }
    else if (event.endTime && (event.endTime.toMillis() + (event.endTimeBuffer ?? 0)) < Date.now()) {
        functions.logger.error(`User ${uid} has attempted sign-in after event named ${event.name} ended`);
        throw new functions.https.HttpsError("deadline-exceeded", "Event has already ended.");
    }
    else if (event.startTime && (event.startTime.toMillis() - (event.startTimeBuffer ?? 0) > Date.now())) {
        functions.logger.error(`User ${uid} has attempted sign-in before event named ${event.name} started`);
        throw new functions.https.HttpsError("failed-precondition", "Event has not started.");
    }
    else if (event.geolocation && event.geofencingRadius) {
        if (!data.location || typeof data.location.latitude != "number" || typeof data.location.longitude != "number" || !isFinite(data.location.latitude) || !isFinite(data.location.longitude)) {
            functions.logger.error(`User ${uid} has passed an invalid location object: ${data.location}`);
            throw new functions.https.HttpsError("invalid-argument", "Invalid geopoint object passed into function.");
        }

        const distance = geographicDistance(event.geolocation, data.location);
        const message = `${event.name} has geofencing enabled and the given user (${uid}) is reported as ${distance} meters away when required radius is ${event.geofencingRadius} + ${ACCEPTABLE_DISTANCE_ERROR} meters.`;
        if (distance > event.geofencingRadius + ACCEPTABLE_DISTANCE_ERROR) {
            functions.logger.error(message);
            throw new functions.https.HttpsError("out-of-range", message);
        }
        else {
            functions.logger.debug(message);
        }
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
    await db.collection(`users/${uid}/event-logs`).doc(data.eventID).set(eventLog, { merge: true });
    functions.logger.log(`User ${uid} successfully signed in and earned ${eventLog.points} points`);

    return { success: true };
});


/**
 * Handles a request from a user to sign out of an event.
 */
export const eventSignOut = functions.https.onCall(async (data, context) => {
    const uid = data.uid || context.auth?.uid;

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data !== "object" || typeof data.eventID !== "string" || typeof data.location !== "object") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const eventDocRef = db.collection("events").doc(data.eventID);
    const event: SHPEEvent | undefined = (await eventDocRef.get()).data();
    if (typeof event !== "object") {
        const message = `Event with id ${data.eventID} could not be found`;
        functions.logger.log(message);
        throw new functions.https.HttpsError("not-found", message);
    }

    // Used to check if user has already signed into event
    const eventLogDocRef = db.collection(`events/${data.eventID}/logs`).doc(uid);
    const eventLog: SHPEEventLog = (await eventLogDocRef.get()).data() ?? {
        uid: uid,
        eventId: eventDocRef.id,
        creationTime: Timestamp.fromMillis(Date.now()),
        verified: true,
    };

    // Check for any possible errors on the user's part
    if (eventLog !== undefined && eventLog.signOutTime !== undefined) {
        functions.logger.error(`User ${uid} attempted sign-out again`);
        throw new functions.https.HttpsError("already-exists", "Sign out time already exists.");
    }
    else if (event.endTime && (event.endTime.toMillis() + (event.endTimeBuffer ?? 0)) < Date.now()) {
        functions.logger.error(`User ${uid} has attempted sign-out after event named ${event.name} ended`);
        throw new functions.https.HttpsError("deadline-exceeded", "Event has already ended.");
    }
    else if (event.startTime && (event.startTime.toMillis() - (event.startTimeBuffer ?? 0) > Date.now())) {
        functions.logger.error(`User ${uid} has attempted sign-out before event named ${event.name} started`);
        throw new functions.https.HttpsError("failed-precondition", "Event has not started.");
    }
    else if (event.geolocation && event.geofencingRadius) {
        if (!data.location || typeof data.location.latitude != "number" || typeof data.location.longitude != "number" || !isFinite(data.location.latitude) || !isFinite(data.location.longitude)) {
            functions.logger.error(`User ${uid} has passed an invalid location object: ${data.location}`);
            throw new functions.https.HttpsError("invalid-argument", "Invalid geopoint object passed into function.");
        }

        const distance = geographicDistance(event.geolocation, data.location);
        const message = `${event.name} has geofencing enabled and the given user (${uid}) is reported as ${distance} meters away when required radius is ${event.geofencingRadius} + ${ACCEPTABLE_DISTANCE_ERROR} meters.`;
        if (distance > event.geofencingRadius + ACCEPTABLE_DISTANCE_ERROR) {
            functions.logger.error(message);
            throw new functions.https.HttpsError("out-of-range", message);
        }
        else {
            functions.logger.debug(message);
        }
    }

    eventLog.signOutTime = Timestamp.fromMillis(Date.now());
    let accumulatedPoints = 0;

    switch (event.eventType) {
        case "Study Hours":
            if (eventLog.signInTime && eventLog.signInTime.toMillis() < eventLog.signOutTime.toMillis()) {
                accumulatedPoints = (eventLog.signOutTime.toMillis() - eventLog.signInTime.toMillis()) / MillisecondTimes.HOUR * (event.pointsPerHour ?? 0);
            }

            // Ensures the points are capped to the amount of hours the event lasts.
            // Only do this when endTime and startTime are truthy (They should be, but we have to take into the case where they're not)
            if (event.endTime && event.startTime) {
                const eventDurationHours = (event.endTime.toMillis() - event.startTime.toMillis()) / MillisecondTimes.HOUR;
                accumulatedPoints = Math.min(eventDurationHours * (event.pointsPerHour ?? 0), accumulatedPoints);
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
            functions.logger.error("Event type is undefined. This means that an issue has occurred during event creation/updating.");
            throw new functions.https.HttpsError("internal", "Event type is undefined. This means that an issue has occurred during event creation/updating.");
        case null:
            functions.logger.error("Event type is undefined. This means that an issue has occurred during event creation/updating.");
            throw new functions.https.HttpsError("internal", "Event type is null. This means that an issue has occurred during event creation/updating.");
        default:
            eventLog.points = (eventLog.points ?? 0) + (event.signOutPoints ?? 0);
            break;
    }

    // Sets log in both event and user collection and ensures both happen by the end of the function. 
    await eventLogDocRef.set(eventLog, { merge: true });
    await db.collection(`users/${uid}/event-logs`).doc(data.eventID).set(eventLog, { merge: true });
    functions.logger.log(`User ${uid} successfully signed in and earned ${eventLog.points} points`);

    return { success: true };
});


export const addInstagramPoints = functions.https.onCall(async (data, context) => {
    const uid = data.uid || context.auth?.uid;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data !== "object" || typeof data.eventID !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const token = context.auth.token;
    if (token.admin !== true && token.officer !== true && token.developer !== true && token.lead !== true && token.representative !== true) {
        throw new functions.https.HttpsError("permission-denied", `Invalid credentials`);
    }

    const eventDocRef = db.collection("events").doc(data.eventID);
    const event: SHPEEvent | undefined = (await eventDocRef.get()).data();
    if (typeof event !== "object") {
        const message = `Event with id ${data.eventID} could not be found`;
        functions.logger.log(message);
        throw new functions.https.HttpsError("not-found", message);
    }

    const eventLogDocRef = db.collection(`events/${data.eventID}/logs`).doc(uid);
    const eventLog: SHPEEventLog = (await eventLogDocRef.get()).data() ?? {
        uid: uid,
        eventId: eventDocRef.id,
        creationTime: Timestamp.fromMillis(Date.now()),
        verified: true,
        points: 0,
        instagramLogs: [],
    };

    eventLog.points = (eventLog.points ?? 0) + (event.signInPoints ?? 0);
    if (!eventLog.instagramLogs) {
        eventLog.instagramLogs = [];
    }
    eventLog.instagramLogs.push(Timestamp.fromMillis(Date.now()));

    await eventLogDocRef.set(eventLog, { merge: true });
    await db.collection(`users/${uid}/event-logs`).doc(data.eventID).set(eventLog, { merge: true });
    functions.logger.log(`User ${uid} successfully signed in and earned ${eventLog.points} points`);

    return { success: true };
});

