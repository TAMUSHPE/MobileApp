import * as functions from 'firebase-functions';
import { AggregateField } from 'firebase-admin/firestore';
import { db } from "./firebaseConfig"


type RankChange = "increased" | "decreased" | "same";

/** Determines rank change based on current and new ranks.
 *  - "increased" means that the overall rank *value* is lower than before
 *  - "decreased" means that the overall rank *value* is higher than before
 *  - "same" means that the overall rank has stayed the same
 */
const getRankChange = (oldRank: any, newRank: number): RankChange => {
    if (oldRank < newRank) return "decreased";
    if (oldRank > newRank) return "increased";
    return "same";
}

/** Updates the rank and rank change status of a user in Firestore database */
const updateUserRank = async (uid: string, userData: FirebaseFirestore.DocumentData, newRank: number) => {
    if (!uid || !userData) return;

    const userDocRef = db.collection('users').doc(uid);
    const rankChange = userData.pointsRank ? getRankChange(userData.pointsRank, newRank) : "same";

    await userDocRef.set({
        pointsRank: newRank,
        rankChange: rankChange,
    }, { merge: true });
}

/** Fetches data from Google Spreadsheet and updates users' ranks in Firestore */
const updateRanks = async (): Promise<string> => {
    try {
        const snapshot = await db.collection('users').orderBy("points", "desc").get();

        let currentRank = 1;
        snapshot.forEach((doc) => {
            updateUserRank(doc.id, doc.data(), currentRank);
            currentRank++;
        });
        console.info(`${snapshot.size} documents updated`);
        return "Success";
    } catch (error) {
        console.error("Error in updateRanks:", error);
        throw new Error("Internal Server error");
    }
}

/** Scheduled function to update ranks daily at 5AM CST */
export const updateRanksScheduled = functions.pubsub.schedule('0 5 * * *').timeZone('America/Chicago').onRun(async (context) => {
    await updateRanks();
});

/** Callable function to manually update ranks */
export const updateRanksOnCall = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    }
    try {
        const result = await updateRanks();
        return {
            status: 'success',
            message: result,
        };
    } catch (error) {
        console.error("Error in updatePointStats:", error);
        throw new functions.https.HttpsError('internal', 'Internal Server Error.');
    }
});

/**
 * Sums all user points from their event log collection and returns this value
 * @param uid Universal identifier for user
 * @returns Total points user has earned from events
 */
const calculateUserPoints = async (uid: string): Promise<number> => {
    const collectionRef = db.collection(`users/${uid}/event-logs`).where('verified', '==', true);
    const sumAggregateQuery = collectionRef.aggregate({
        totalPoints: AggregateField.sum('points'),
    });

    return sumAggregateQuery.get()
        .then((snapshot) => {
            return snapshot.data().totalPoints;
        })
        .catch((err: any) => {
            functions.logger.error(`Issue updating points for user with UID ${uid}:`, err);
            return 0;
        });
};

/**
 * Sums all user points from their event log collection from the past month and returns this value
 * @param uid Universal identifier for user
 * @returns Total points user has earned from events over the past month
 */
const calculateUserPointsThisMonth = async (uid: string): Promise<number> => {
    const currentDate = new Date();
    const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First minute of month
    const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // First minute of next month

    const collectionRef = db.collection(`users/${uid}/event-logs`)
        .where('creationTime', '>=', startTime)
        .where('creationTime', '<=', endTime)
        .where('verified', '==', true);

    const sumAggregateQuery = collectionRef.aggregate({
        totalPoints: AggregateField.sum('points'),
    });

    return sumAggregateQuery.get()
        .then((snapshot) => {
            return snapshot.data().totalPoints;
        })
        .catch((err: any) => {
            functions.logger.error(`Issue updating points for user with UID ${uid}:`, err);
            return 0;
        });
}

/** Callable https function which updates the point values of a given user users */
export const updateUserPoints = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    } else if (typeof data.uid !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid data types passed into function");
    }

    const token = context.auth.token;
    if (token.admin !== true && token.officer !== true && token.developer !== true && token.secretary !== true) {
        throw new functions.https.HttpsError("permission-denied", `Invalid credentials`);
    }

    const userDocRef = db.doc(`users/${data.uid}`);
    return userDocRef.set({
        points: await calculateUserPoints(data.uid),
        pointsThisMonth: await calculateUserPointsThisMonth(data.uid),
    }, { merge: true })
        .then(() => {
            return { success: true }
        })
        .catch((err) => {
            throw new functions.https.HttpsError("aborted", `Issue occured while attempting to update user document: ${err}`);
        });
});

/** Callable https function which updates the point values of all users */
export const updateAllUserPoints = functions.https.onCall(async (_, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Function cannot be called without authentication.");
    }

    const token = context.auth.token;
    if (token.admin !== true && token.officer !== true && token.developer !== true && token.secretary !== true) {
        throw new functions.https.HttpsError("permission-denied", `Invalid credentials`);
    }

    return db.collection('users').get()
        .then((snapshot) => {
            snapshot.forEach(async (document) => {
                document.ref.set({
                    points: await calculateUserPoints(document.id),
                    pointsThisMonth: await calculateUserPointsThisMonth(document.id),
                }, { merge: true });
            });

            return { success: true };
        })
        .catch((err) => {
            throw new functions.https.HttpsError("aborted", `Issue occured while attempting to update user document: ${err}`);
        });
});

export const scheduledUpdateAllPoints = functions.pubsub.schedule('0 5 * * *').timeZone('America/Chicago').onRun(async (context) => {
    try {
        const snapshot = await db.collection('users').get();
        const updatePromises = snapshot.docs.map(async (document) => {
            return document.ref.set({
                points: await calculateUserPoints(document.id),
                pointsThisMonth: await calculateUserPointsThisMonth(document.id),
            }, { merge: true });
        });
        await Promise.all(updatePromises);
        return { success: true };
    } catch (err) {
        throw new functions.https.HttpsError("aborted", `Issue occurred while attempting to update user documents: ${err}`);
    }
});

