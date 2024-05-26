import { Committee } from "../types/Committees"
import { PrivateUserInfo, PublicUserInfo } from "../types/User"
import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from "@/app/api/firebaseConfig";
import { SHPEEvent, SHPEEventLog } from "@/app/types/Events";

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

/**
 * Obtains the private data of a user given their UID. Returns undefined if the currently logged-in user does not have permissions.
 * 
 * @param uid - Universal ID tied to a registered user.
 * @returns - Promise of data. An undefined return means that the file does not exist or the user does not have permissions to access the document.
 */
export const getPrivateUserData = async (uid: string = ""): Promise<PrivateUserInfo | undefined> => {
    if (!auth.currentUser?.uid) {
        throw new Error("Authentication Error", { cause: "User uid is undefined" });
    }
    else if (!uid) {
        uid = auth.currentUser?.uid;
    }

    return await getDoc(doc(db, `users/${uid}/private`, "privateInfo"))
        .then((res) => {
            const responseData = res.data()
            return responseData;
        })
        .catch(err => {
            console.error(err);
            return undefined;
        });
};


export const getMembers = async (): Promise<(PublicUserInfo & { privateInfo?: PrivateUserInfo, eventLogs?: SHPEEventLog[] })[]> => {
    try {
        const userRef = collection(db, 'users');
        const q = query(userRef, orderBy("points", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const members = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const publicInfo = doc.data();
            const uid = doc.id;

            // Fetch private info
            let privateInfo;
            try {
                privateInfo = await getPrivateUserData(uid);
            } catch (error) {
                console.error("Error fetching private data for user:", uid, error);
            }

            // Fetch event logs
            let eventLogs: SHPEEventLog[] = [];
            try {
                const eventLogsRef = collection(db, `users/${uid}/event-logs`);
                const eventLogsSnapshot = await getDocs(eventLogsRef);
                eventLogs = eventLogsSnapshot.docs.map(doc => doc.data()); // Adjust according to your event log structure
            } catch (error) {
                console.error("Error fetching event logs for user:", uid, error);
            }

            return {
                ...publicInfo,
                uid,
                privateInfo,
                eventLogs
            };
        }));

        return members;

    } catch (error) {
        console.error("Error fetching members:", error);
        throw new Error("Internal Server Error.");
    }
};


export const getEvents = async (): Promise<SHPEEvent[]> => {
    try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef);
        const querySnapshot = await getDocs(q);
        const events: SHPEEvent[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as SHPEEvent
        }));

        events.sort((a, b) => {
            const dateA = a.startTime ? a.startTime.toDate() : undefined;
            const dateB = b.startTime ? b.startTime.toDate() : undefined;

            return dateA && dateB ? dateA.getTime() - dateB.getTime() : -1;
        });

        return events;
    } catch (error) {
        console.error("Error fetching events:", error);
        throw new Error("Unable to fetch events.");
    }
};

export const getEventLogs = async (eventId: string): Promise<SHPEEventLog[]> => {
    try {
        const eventLogsRef = collection(db, `events/${eventId}/logs`);
        const querySnapshot = await getDocs(eventLogsRef);

        const eventLogs: SHPEEventLog[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as SHPEEventLog
        }));

        return eventLogs;
    } catch (error) {
        console.error("Error fetching event logs:", error);
        throw new Error("Unable to fetch event logs.");
    }
};
