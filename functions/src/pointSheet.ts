import * as functions from 'firebase-functions';
import {queryGoogleSpreadsheet, GoogleSheetsIDs} from "../../src/api/fetchGoogleSheets"
import { db, auth } from "./firebaseConfig"
import { RankChange } from "../../src/types/User";

async function getUIDbyEmail(email: string): Promise<string | null> {
    try {
        const usersSnapshot = await auth.getUserByEmail(email);
        return usersSnapshot ? usersSnapshot.uid : null;
    } catch (error) {
        return null;
    }
}

const getRankChange = (userData: any, newRank: number): RankChange => {
    if (userData.rank < newRank) return "increased";
    if (userData.rank > newRank) return "decreased";
    return "same";
}

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


const updateRanks = async () => {
    try {
        const response = await queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID);
        const rows = response?.table.rows;

        if (!rows) return "No rows to update.";

        for (let i = 0; i < rows.length; i++) {
            const email = rows[i].c[2]?.v;
            await updateUserRank(email, i + 1);
        }

        return "Successfully updated ranks!";
    } catch (error) {
        console.error("Error in updateRanksLogic:", error);
        throw new Error("Internal Server Error.");
    }
}
// runs at 5AM CST daily 
export const updateRanksScheduled = functions.pubsub.schedule('0 5 * * *').timeZone('America/Chicago').onRun(async (context) => {
    await updateRanks()
});

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