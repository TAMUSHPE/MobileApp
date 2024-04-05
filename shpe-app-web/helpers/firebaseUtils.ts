
import { Committee } from "../types/Committees"
import { PublicUserInfo } from "../types/User"
import {collection , getDocs,getDoc , doc} from 'firebase/firestore';
import { db ,auth} from "@/api/firebaseConfig";

export const getCommittees = async (): Promise<Committee[]> => {
   try {
       const committeeCollectionRef = collection(db, 'committees');
       const snapshot = await getDocs(committeeCollectionRef);
       const committees = snapshot.docs
           .filter(doc => doc.id !== "committeeCounts") // ignore committeeCounts document
           .map(doc => ({
               firebaseDocName: doc.id,
               ...doc.data()
           }));
       return committees;
   } catch (err) {
       console.error(err);
       return [];
   }
 };

 /**
* Obtains the public information of a user given their UID.
*
* @param uid - The universal ID tied to a registered user.
* @returns - Promise of data. An undefined return means that the file does not exist or the user does not have permissions to access the document.
*/
export const getPublicUserData = async (uid: string = ""): Promise<PublicUserInfo | undefined> => {
   if (!auth.currentUser?.uid) {
       throw new Error("Authentication Error", { cause: "User uid is undefined" });
   }
   if (!uid) {
       uid = auth.currentUser?.uid;
   }
   //! TODO: Grab point amount
   return getDoc(doc(db, "users", uid))
       .then(async (res) => {
           const responseData = res.data()
           return {
               ...responseData
           }
       })
       .catch(err => {
           console.error(err);
           return undefined;
       });
};
