import * as functions from 'firebase-functions';
import { db, auth } from "./firebaseConfig"
import { queryGoogleSpreadsheet, GoogleSheetsIDs } from "../../src/api/fetchGoogleSheets"
import { RankChange } from "../../src/types/User";


/** Fetches UID associated with an email from Firebase Authentication */
const getUIDbyEmail = async (email: string): Promise<string | null> => {
    try {
        const usersSnapshot = await auth.getUserByEmail(email);
        return usersSnapshot?.uid ?? null;
    } catch (error) {   
        console.error("Error fetching UID by email:", error);
        return null;
    }
}

/** Determines rank change based on current and new ranks. */
const getRankChange = (userData: any, newRank: number): RankChange => {
    if (userData.rank < newRank) return "increased";
    if (userData.rank > newRank) return "decreased";
    return "same";
}

/** Updates the rank and rank change status of a user in Firestore database */
const updateUserRank = async (email: string, newRank: number) => {
    if (!email) return;

    const uid = await getUIDbyEmail(email);
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
        const response = await queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID);
        const rows = response?.table.rows;

        if (!rows) return "No rows to update.";

        const updatePromises = rows.map((row, i) => updateUserRank(row.c[2]?.v, i + 1));
        await Promise.all(updatePromises);

        return "Successfully updated ranks!";
    } catch (error) {
        console.error("Error in updateRanksLogic:", error);
        throw new Error("Internal Server Error.");
    }
}

/** Scheduled function to update ranks daily at 5AM CST */
export const updateRanksScheduled = functions.pubsub.schedule('0 5 * * *').timeZone('America/Chicago').onRun(async (context) => {
    await updateRanks()
});

/** Callable function to manually update ranks */
export const updateRanksOnCall = functions.https.onCall(async (data, context) => {
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