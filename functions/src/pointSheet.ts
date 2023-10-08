import * as functions from 'firebase-functions';
import { db } from "./firebaseConfig"
import { RankChange } from "./types";

/** Determines rank change based on current and new ranks. */
const getRankChange = (userData: any, newRank: number): RankChange => {
    if (userData.rank < newRank) return "increased";
    if (userData.rank > newRank) return "decreased";
    return "same";
}

/** Updates the rank and rank change status of a user in Firestore database */
const updateUserRank = async (uid: string, newRank: number) => {
    if (!uid) return;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    if (!userData) return;

    const rankChange = getRankChange(userData, newRank);

    await userDocRef.set({
        pointsRank: newRank,
        rankChange: rankChange,
    }, { merge: true });
}

/** Fetches data from Google Spreadsheet and updates users' ranks in Firestore */
const updateRanks = async () => {
    try {
        const snapshot = await db.collection('users').orderBy("points").get();

        var currentRank = 1;
        snapshot.forEach((doc) => {
            updateUserRank(doc.id, currentRank);
            currentRank++;
        })
        
    } catch (error) {
        console.error("Error in updateRanks:", error);
        throw new Error("Internal Server error");
    }
}

/** Scheduled function to update ranks daily at 5AM CST */
export const updateRanksScheduled = functions.pubsub.schedule('0 5 * * *').timeZone('America/Chicago').onRun(async (context) => {
    await updateRanks()
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