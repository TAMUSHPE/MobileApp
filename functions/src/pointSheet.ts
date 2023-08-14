import * as functions from 'firebase-functions';
import {queryGoogleSpreadsheet, GoogleSheetsIDs} from "../../src/api/fetchGoogleSheets"
import { db, auth } from "./firebaseConfig"

async function getUIDbyEmail(email: string): Promise<string | null> {
    try {
        const usersSnapshot = await auth.getUserByEmail(email);
        return usersSnapshot ? usersSnapshot.uid : null;
    } catch (error) {
        return null;
    }
}

const updateRanks = async () => {
    try {
        const response = await queryGoogleSpreadsheet(GoogleSheetsIDs.POINTS_ID);
        const rows = response?.table.rows;
        if (rows) {
            for (let i = 0; i < rows.length; i++) {
                const email = rows[i].c[2]?.v;
                console.log(email)
                if (email) {
                    const uid = await getUIDbyEmail(email);
                    if (uid) {
                        const userDocRef = db.collection('users').doc(uid);
                        const userDoc = await userDocRef.get();                        
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            if (userData) {
                                let rankChange: "decreased" | "same" | "increased";
                                const newRank = i + 1;                             
                                switch (true) {
                                    case (userData.rank < newRank):
                                        rankChange = "increased";
                                        break;
                                        case (userData.rank > newRank):
                                            rankChange = "decreased";
                                            break;
                                            default:
                                                rankChange = "same";
                                            }        
                                            
                                            await userDocRef.set({
                                    rank: newRank, 
                                    rankChange: rankChange,
                                }, { merge: true });
                            }
                        }
                    }
                }     
            }
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