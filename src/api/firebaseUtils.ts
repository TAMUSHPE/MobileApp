import { auth, db, functions, storage } from "../config/firebaseConfig";
import { ref, uploadBytesResumable, UploadTask, UploadMetadata } from "firebase/storage";
import { doc, setDoc, getDoc, arrayUnion, collection, where, query, getDocs, orderBy, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp, limit, startAfter, Query, DocumentData, CollectionReference, QueryDocumentSnapshot, increment, runTransaction, deleteField } from "firebase/firestore";
import { HttpsCallableResult, httpsCallable } from "firebase/functions";
import { memberPoints } from "./fetchGoogleSheets";
import { validateTamuEmail } from "../helpers/validation";
import { OfficerStatus, PrivateUserInfo, PublicUserInfo, Roles, User, UserFilter } from "../types/User";
import { Committee } from "../types/Committees";
import { SHPEEvent, EventLogStatus } from "../types/Events";


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
            const points = await memberPoints(responseData?.email); // Queries google sheets for points data
            return {
                ...responseData,
                points: points,
            }
        })
        .catch(err => {
            console.error(err);
            return undefined;
        });
};


/**
 * Sets the public data of the currently logged-in user. This data is readable by anyone.
 * 
 * @param data - The data to be stored as public data. Any pre-existing fields in Firestore will not be removed.
 */
export const setPublicUserData = async (data: PublicUserInfo, uid: string = "") => {
    if (!auth.currentUser?.uid) {
        throw new Error("Authentication Error", { cause: "Current user uid is undefined" });
    }

    if (!uid) {
        uid = auth.currentUser?.uid;
    }

    await setDoc(doc(db, "users", uid), data, { merge: true })
        .catch(err => console.error(err));
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


/**
 * Sets the private data of the currently logged-in user. This data is readable only by the user.
 * 
 * @param data - The data to be stored as private data. Any pre-existing fields in Firestore will not be removed.
 */
export const setPrivateUserData = async (data: PrivateUserInfo) => {
    await setDoc(doc(db, `users/${auth.currentUser?.uid!}/private`, "privateInfo"), data, { merge: true })
        .catch(err => console.error(err));
};


/**
 * Obtains all data related to a user. Any undefined fields mean the currently logged-in user does not have permissions to those fields.
 * 
 * @param uid - Universal ID tied to a registered user.
 * @returns - User data formatted according to User interface defined in "./src/types/User.tsx".
 */
export const getUser = async (uid: string): Promise<User | undefined> => {
    if (!auth.currentUser?.uid) {
        throw new Error("Authentication Error", { cause: "User uid is undefined" });
    }
    const publicData = await getPublicUserData(uid);
    const privateData = await getPrivateUserData(uid);
    if (publicData == undefined) {
        return undefined;
    }
    else {
        return {
            publicInfo: publicData,
            private: {
                privateInfo: privateData,
            },
        };
    }
};


/**
 * Obtains user data and UID by the given email.
 * 
 * @param email Email address associated with a user.
 * @returns Object containing user data and UID, or null if no user found for the provided email.
 */
export const getUserByEmail = async (email: string): Promise<{ userData: PublicUserInfo, userUID: string } | null> => {
    try {
        const userRef = collection(db, 'users');
        const q = query(userRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const [userDoc] = querySnapshot.docs;
        const userData = userDoc.data();
        const userUID = userDoc.id;

        return { userData, userUID };

    } catch (error) {
        console.error("Error fetching user by email:", error);
        throw new Error("Internal Server Error.");
    }
}

type FetchMembersOptions = {
    lastUserSnapshot?: QueryDocumentSnapshot<DocumentData> | null,
    isOfficer?: boolean,
    numLimit?: number | null,
    filter: UserFilter,
};

export const getUserForMemberList = async (options: FetchMembersOptions) => {
    const {
        lastUserSnapshot,
        numLimit = null,
        filter,
    } = options;
    let userQuery: Query<DocumentData, DocumentData> = collection(db, 'users');

    if (filter.classYear != "") {
        userQuery = query(userQuery, where("classYear", "==", filter.classYear));
    }

    if (filter.major != "") {
        const majorUpper = filter.major.toUpperCase();
        userQuery = query(userQuery, where("major", "==", majorUpper));
    }

    userQuery = query(userQuery, where("roles.officer", "==", false));

    if (filter.role && filter.role !== "") {
        const roleQuery = `roles.${filter.role}`;
        userQuery = query(userQuery, where(roleQuery, "==", true));
    }

    // Limit the number of results
    if (numLimit !== null) {
        userQuery = query(userQuery, limit(numLimit));
    }

    // Start after the last retrieved document
    if (lastUserSnapshot) {
        userQuery = query(userQuery, startAfter(lastUserSnapshot));
    }

    try {
        const snapshot = await getDocs(userQuery);
        const hasMoreUser = numLimit !== null ? snapshot.docs.length >= numLimit : false;

        return {
            members: snapshot.docs,
            lastSnapshot: snapshot.docs[snapshot.docs.length - 1],
            hasMoreUser
        };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { members: [], lastSnapshot: null, hasMoreUser: false };
    }
};


/**
 * Appends an Expo push token to the current user's private data.
 * 
 * @param expoPushToken - The Expo push token to append.
 */
export const appendExpoPushToken = async (expoPushToken: string) => {
    await setDoc(doc(db, `users/${auth.currentUser?.uid!}/private`, "privateInfo"),
        {
            expoPushTokens: arrayUnion(expoPushToken)
        },
        { merge: true })
        .catch(err => console.error(err));
};


/**
 * Obtains information on the current user.
 * 
 * defaultPublicInfo and defaultPrivateInfo are what a user object should initialize as should either be undefined.
 * If any fields are undefined in the returned user from getUser(), values from defaultPublicInfo and defaultPrivateInfo will be pulled
 * 
 * @returns User data formatted according to User interface defined in "./src/types/User.tsx".
 */
export const initializeCurrentUserData = async (): Promise<User> => {

    /**
     * Both defaultPublicInfo and defaultPrivateInfo contain critical information used for the app to work as intended.
     * Should any values not exist in the returned object from firebase, the default data will be used instead.
     */
    const defaultPublicInfo: PublicUserInfo = {
        email: auth.currentUser?.email ?? "",
        tamuEmail: validateTamuEmail(auth.currentUser?.email, false) ? auth.currentUser!.email! : "",
        displayName: auth.currentUser?.displayName ?? "",
        photoURL: auth.currentUser?.photoURL ?? "",
        roles: {
            reader: true,
            officer: false,
            admin: false,
            developer: false,
        },
    };

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const defaultPrivateInfo: PrivateUserInfo = {
        completedAccountSetup: false,
        settings: {
            darkMode: false,
        },
        expirationDate: oneWeekFromNow,
    };

    const user = await getUser(auth.currentUser?.uid!);

    if (!user) {
        setPublicUserData(defaultPublicInfo);
        setPrivateUserData(defaultPrivateInfo);
        return {
            publicInfo: defaultPublicInfo,
            private: {
                privateInfo: defaultPrivateInfo,
            },
        };
    }
    else {
        const defaultRoles = defaultPublicInfo.roles!; // Shallow copy roles 
        const updatedUser = {
            publicInfo: {
                ...Object.assign(defaultPublicInfo, user.publicInfo),
                roles: Object.assign(defaultRoles, user.publicInfo?.roles),
            },
            private: {
                privateInfo: Object.assign(defaultPrivateInfo, user.private?.privateInfo),
                moderationData: {
                    ...user.private?.moderationData,
                }
            }
        };
        setPublicUserData(updatedUser.publicInfo);
        setPrivateUserData(updatedUser.private.privateInfo);

        return updatedUser;
    }
};


/**
 * Uploads a file blob to Firebase given a URL. Taken from: https://firebase.google.com/docs/storage/web/upload-files
 * 
 * @param file - File blob to be uploaded.
 * @param path - Path name of the file in Firebase.
 * @returns - Task of file being uploaded.
 */
export const uploadFileToFirebase = (file: Uint8Array | ArrayBuffer | Blob, path: string, metadata?: UploadMetadata): UploadTask => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    return uploadTask;
};


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
export const setCommitteeData = async (committeeData: Committee) => {
    try {
        await setDoc(doc(db, `committees/${committeeData.firebaseDocName}`), {
            name: committeeData.name || "",
            color: committeeData.color || "#500000",
            description: committeeData.description || "",
            head: committeeData.head || "",
            representatives: committeeData.representatives || [],
            leads: committeeData.leads || [],
            memberApplicationLink: committeeData.memberApplicationLink || "",
            representativeApplicationLink: committeeData.representativeApplicationLink || "",
            leadApplicationLink: committeeData.leadApplicationLink || "",
            logo: committeeData.logo || "default",
            memberCount: committeeData.memberCount || 0,
        }, { merge: true });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const resetCommittee = async (firebaseDocName: string) => {
    const committeeRef = doc(db, 'committees', firebaseDocName);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.update(committeeRef, {
                memberCount: 0,
                memberApplicationLink: '',
                leadApplicationLink: '',
                representativeApplicationLink: '',
                head: deleteField(),
                leads: [],
                representatives: []
            });

            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach((userDoc) => {
                if (userDoc.data().committees.includes(firebaseDocName)) {
                    const updatedCommittees = userDoc.data().committees.filter((committee: string) => committee !== firebaseDocName);
                    transaction.update(doc(db, 'users', userDoc.id), { committees: updatedCommittees });
                }
            });
        });
    } catch (error) {
        console.error('Failed to reset committee:', error);
    }
};

export const deleteCommittee = async (firebaseDocName: string) => {
    const committeeRef = doc(db, 'committees', firebaseDocName);

    try {
        await runTransaction(db, async (transaction) => {
            transaction.delete(committeeRef);

            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach((userDoc) => {
                if (userDoc.data().committees.includes(firebaseDocName)) {
                    const updatedCommittees = userDoc.data().committees.filter((committee: string) => committee !== firebaseDocName);
                    transaction.update(doc(db, 'users', userDoc.id), { committees: updatedCommittees });
                }
            });
        });
    } catch (error) {
        console.error('Failed to delete committee:', error);
    }
};

export const getWatchlist = async () => {
    const docRef = doc(db, "restrictions/watchlist");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().list : [];
};

export const getBlacklist = async () => {
    const docRef = doc(db, "restrictions/blacklist");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().list : [];
};


export const addToWatchlist = async (userToAdd: PublicUserInfo) => {
    const currentWatchlist = await getWatchlist() || [];

    if (!currentWatchlist.some((user: PublicUserInfo) => user.uid === userToAdd.uid)) {
        const updatedWatchlist = [...currentWatchlist, userToAdd];
        await setDoc(doc(db, "restrictions/watchlist"), { list: updatedWatchlist }, { merge: true });
    }
};

export const addToBlacklist = async (userToAdd: PublicUserInfo) => {
    const currentBlacklist = await getBlacklist() || [];

    if (!currentBlacklist.some((user: PublicUserInfo) => user.uid === userToAdd.uid)) {
        const updatedBlacklist = [...currentBlacklist, userToAdd];
        await setDoc(doc(db, "restrictions/blacklist"), { list: updatedBlacklist }, { merge: true });
    }
};

export const removeFromWatchlist = async (userToRemove: PublicUserInfo) => {
    const currentWatchlist = await getWatchlist() || [];

    const updatedWatchlist = currentWatchlist.filter((user: PublicUserInfo) => user.uid !== userToRemove.uid);

    await setDoc(doc(db, "restrictions/watchlist"), { list: updatedWatchlist }, { merge: true });
};

export const removeFromBlacklist = async (userToRemove: PublicUserInfo) => {
    const currentBlacklist = await getBlacklist() || [];

    const updatedBlacklist = currentBlacklist.filter((user: PublicUserInfo) => user.uid !== userToRemove.uid);

    await setDoc(doc(db, "restrictions/blacklist"), { list: updatedBlacklist }, { merge: true });
};

export const isUserInBlacklist = async (uid: string): Promise<boolean> => {
    const blacklistDocRef = doc(db, "restrictions/blacklist");
    const docSnap = await getDoc(blacklistDocRef);

    if (docSnap.exists()) {
        const blacklist = docSnap.data().list;
        return blacklist.some((user: PublicUserInfo) => user.uid === uid);
    } else {
        // Blacklist document does not exist or has no data
        return false;
    }
};

export const createEvent = async (event: SHPEEvent): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, "events"), { ...event });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
};

export const updateEvent = async (event: SHPEEvent) => {
    try {
        const docRef = doc(db, "events", event.id!);
        await updateDoc(docRef, {
            ...event
        });
        return event.id;
    } catch (error) {
        console.error("Error updating document: ", error);
        return null;
    }
}

export const getEvent = async (eventID: string) => {
    try {
        const eventRef = doc(db, "events", eventID);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
            return eventDoc.data() as SHPEEvent;
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return null;
    }
}

export const getUpcomingEvents = async () => {
    const currentTime = new Date();
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("endTime", ">", currentTime));
    const querySnapshot = await getDocs(q);
    const events: SHPEEvent[] = [];
    querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
    });

    events.sort((a, b) => {
        const dateA = a.startTime ? a.startTime.toDate() : undefined;
        const dateB = b.startTime ? b.startTime.toDate() : undefined;

        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        }
        return -1; // error
    });

    return events;
};

export const getPastEvents = async () => {
    const currentTime = new Date();
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("endTime", "<", currentTime));
    const querySnapshot = await getDocs(q);
    const events: SHPEEvent[] = [];
    querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
    });
    events.sort((a, b) => {
        const dateA = a.startTime ? a.startTime.toDate() : undefined;
        const dateB = b.startTime ? b.startTime.toDate() : undefined;

        if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
        }
        return -1; // error
    });

    return events;
};

export const destroyEvent = async (eventID: string) => {
    try {
        const eventRef = doc(db, "events", eventID);
        const logRef = collection(db, `/events/${eventID}/logs`);
        const summaryRef = collection(db, `/events/${eventID}/summaries`);

        const deleteSubCollection = async (ref: CollectionReference) => {
            const snapshot = await getDocs(query(ref));
            if (!snapshot.empty) {
                const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
            }
        };

        await deleteSubCollection(logRef);
        await deleteSubCollection(summaryRef);

        await deleteDoc(eventRef);

        return true;
    } catch (error) {
        console.error("Error deleting event and its related data: ", error);
        return false;
    }
};


const getEventStatus = async (eventId: string): Promise<EventLogStatus> => {
    try {
        const eventDoc = doc(db, `events/${eventId}`);
        const eventDocRef = await getDoc(eventDoc);
        if (eventDocRef.exists()) {
            const eventData = eventDocRef.data();
            const eventEndDate = eventData?.endDate;
            if (eventEndDate) {
                const eventEndTime = (eventEndDate as Timestamp).toDate().getTime();
                const currentTime = new Date().getTime();

                if (currentTime > eventEndTime) {
                    return EventLogStatus.EVENT_OVER;
                } else {
                    return EventLogStatus.EVENT_ONGOING;
                }
            }
        }
    } catch (error) {
        console.error("Error checking event active status: ", error);
    }
    return EventLogStatus.ERROR;
};

export const getAttendanceNumber = async (eventId: string): Promise<number | null> => {
    try {
        const summaryDoc = doc(db, `events/${eventId}/summaries/default`);
        const summaryDocRef = await getDoc(summaryDoc);

        if (summaryDocRef.exists()) {
            const data = summaryDocRef.data();
            return data?.attendance || 0;
        } else {
            return null;
        }
    } catch (e) {
        console.error("Error fetching attendance number: ", e);
        return null;
    }
}

/**
 * Signs a user into an event given an event id
 * @param eventID ID of event to sign into. This is the name of the event document in firestore
 * @returns Status representing the status of the cloud function
 */
export const signInToEvent = async (eventID: string): Promise<EventLogStatus> => {
    return await httpsCallable(functions, "eventSignIn")
        .call(null, { eventID })
        .then((result) => {
            if (typeof result.data == "object" && result.data && (result.data as any).success) {
                return EventLogStatus.SUCCESS
            }
            else {
                return EventLogStatus.ERROR
            }
        })
        .catch(err => {
            switch (err.code) {
                case 'functions/already-exists':
                    return EventLogStatus.ALREADY_LOGGED;
                case 'functions/failed-precondition':
                    return EventLogStatus.EVENT_NOT_STARTED;
                case 'functions/not-found':
                    return EventLogStatus.EVENT_NOT_FOUND;
                case 'functions/deadline-exceeded':
                    return EventLogStatus.EVENT_OVER;
                default:
                    console.error(err);
                    return EventLogStatus.ERROR;
            }
        });
}

/**
 * Signs a user into an event given an event id
 * @param eventID ID of event to sign into. This is the name of the event document in firestore
 * @returns Status representing the status of the cloud function
 */
export const signOutOfEvent = async (eventID: string): Promise<EventLogStatus> => {
    return await httpsCallable(functions, "eventSignOut")
        .call(null, { eventID })
        .then((result) => {
            if (typeof result.data == "object" && result.data && (result.data as any).success) {
                return EventLogStatus.SUCCESS
            }
            else {
                return EventLogStatus.ERROR
            }
        })
        .catch(err => {
            switch (err.code) {
                case 'functions/failed-precondition':
                    return EventLogStatus.EVENT_NOT_STARTED;
                case 'functions/not-found':
                    return EventLogStatus.EVENT_NOT_FOUND;
                case 'functions/deadline-exceeded':
                    return EventLogStatus.EVENT_OVER;
                default:
                    console.error(err);
                    return EventLogStatus.ERROR;
            }
        });
}

export const isUserSignedIn = async (eventId: string, uid: string) => {
    const eventLogDocRef = doc(db, 'events', eventId, 'logs', uid);
    const docSnap = await getDoc(eventLogDocRef);

    if (docSnap.exists()) {
        return true;
    } else {
        return false;
    }
}

export const getMemberOfTheMonth = async () => {
    return getDoc(doc(db, `member-of-the-month/member`))
        .then((res) => {
            const responseData = res.data();
            if (responseData) {
                return responseData.member as PublicUserInfo;
            }
            else {
                return undefined;
            }
        })
        .catch(err => {
            console.error(err);
            return undefined;
        });
}

export const setMemberOfTheMonth = async (member: PublicUserInfo) => {
    try {
        await setDoc(doc(db, `member-of-the-month/member`), {
            member: member
        }, { merge: true });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

/**
 * This function sets a given user's roles and custom claims on firebase.
 * @param uid UID of user which will have their roles modified
 * @param roles Object containing roles which will be modified
 * @returns Response from firebase. If there is a communication error, it will return undefined.
 * @throws FirebaseError if an issue occurs while attempting to call the firebase function 
 * @example
 * const uid = "H0ywaA729AkC8s2Km29"; // Example UID
 * 
 * // Makes the given user a developer, but removes their admin permissions. All other permissions are untouched.
 * const roles = {
 *   developer: true,
 *   admin: false
 * };  
 * 
 * await setUserRoles(uid, roles);
 */
export const setUserRoles = async (uid: string, roles: Roles): Promise<HttpsCallableResult | undefined> => {
    const claims = (await auth.currentUser?.getIdTokenResult())?.claims;

    // Guards so the app will not call the function without authentication or permissions
    // updateUserRole() also checks for these when it is called in the case of a foreign request
    if (!claims) {
        throw new Error("setUserRoles() requires authentication", { cause: "auth.currentUser?.getIdTokenResult() evaluates as undefined" });
    }
    else if (!(claims.admin || claims.developer || claims.officer)) {
        throw new Error("setUserRoles() called with Invalid Permissions", { cause: "" })
    }

    // Updates given user's custom claims by calling 
    return httpsCallable(functions, "updateUserRole").call({}, { uid, roles })
        .then(async (res) => {
            // Sets given user's publicUserInfo firestore document to reflect change in claims
            const currentRoles = (await getPublicUserData())?.roles ?? {};
            await setPublicUserData({
                roles: Object.assign(currentRoles, roles)
            }, uid);
            return res;
        });
};


export const getMembersExcludeOfficers = async (): Promise<PublicUserInfo[]> => {
    try {
        const userRef = collection(db, 'users');
        const q = query(
            userRef,
            where("roles.officer", "==", false),
            orderBy("name")
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const members = querySnapshot.docs.map((doc) => {
            return {
                ...doc.data(),
                uid: doc.id
            }
        });

        return members;

    } catch (error) {
        console.error("Error fetching members:", error);
        throw new Error("Internal Server Error.");
    }
}

export const getTeamMembers = async (): Promise<PublicUserInfo[]> => {
    try {
        const userRef = collection(db, 'users');
        const querySnapshot = await getDocs(userRef);
        if (querySnapshot.empty) {
            return [];
        }

        const users = querySnapshot.docs.map((doc) => {
            return {
                ...doc.data(),
                uid: doc.id
            } as PublicUserInfo
        });

        const filteredUsers = users.filter(user =>
            user.roles?.officer === true ||
            user.roles?.lead === true ||
            user.roles?.representative === true
        );

        return filteredUsers;

    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Internal Server Error.");
    }
}

export const getOfficers = async () => {
    try {
        const userQuery = query(collection(db, 'users'), where('roles.officer', '==', true));
        const querySnapshot = await getDocs(userQuery);
        const officers = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        return officers;
    } catch (error) {
        console.error('Error fetching officers:', error);
        return [];
    }
};

export const getRepresentatives = async (): Promise<PublicUserInfo[]> => {
    try {
        const userRef = collection(db, 'users');
        const querySnapshot = await getDocs(userRef);
        if (querySnapshot.empty) {
            return [];
        }

        const users = querySnapshot.docs.map((doc) => {
            return {
                ...doc.data(),
                uid: doc.id
            } as PublicUserInfo
        });

        const representatives = users.filter(user => user.roles?.representative === true);

        return representatives;

    } catch (error) {
        console.error("Error fetching representatives:", error);
        throw new Error("Internal Server Error.");
    }
}


export const getLeads = async (): Promise<PublicUserInfo[]> => {
    try {
        const userRef = collection(db, 'users');
        const querySnapshot = await getDocs(userRef);
        if (querySnapshot.empty) {
            return [];
        }

        const users = querySnapshot.docs.map((doc) => {
            return {
                ...doc.data(),
                uid: doc.id
            } as PublicUserInfo
        });

        const leads = users.filter(user => user.roles?.lead === true);

        return leads;

    } catch (error) {
        console.error("Error fetching leads:", error);
        throw new Error("Internal Server Error.");
    }
}



export const getMembersToVerify = async (): Promise<PublicUserInfo[]> => {
    const memberSHPERef = collection(db, 'memberSHPE');
    const memberSHPEQuery = query(memberSHPERef);
    const memberSHPESnapshot = await getDocs(memberSHPEQuery);
    const memberSHPEUserIds = memberSHPESnapshot.docs.map(doc => doc.id);

    const members: PublicUserInfo[] = [];
    for (const userId of memberSHPEUserIds) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            members.push({ uid: userId, ...userDocSnap.data() });
        }
    }

    return members;
};

export const getMembersToResumeVerify = async (): Promise<PublicUserInfo[]> => {
    const resumeRef = collection(db, 'resumeVerification');
    const resumeQuery = query(resumeRef);
    const resumeSnapshot = await getDocs(resumeQuery);
    const resumeUserIds = resumeSnapshot.docs.map(doc => doc.id);

    const members: PublicUserInfo[] = [];
    for (const userId of resumeUserIds) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            members.push({ uid: userId, ...userDocSnap.data() });
        }
    }

    return members;
};


export const isUsernameUnique = async (username: string): Promise<boolean> => {
    const checkUsernameUniqueness = httpsCallable<{ username: string }, { unique: boolean }>(functions, 'checkUsernameUniqueness');

    try {
        const result = await checkUsernameUniqueness({ username });
        return result.data.unique;
    } catch (error) {
        console.error('Error checking username uniqueness:', error);
        return false; // handle error appropriately
    }
};


export const fetchUsersWithPublicResumes = async (filters: {
    major?: string;
    classYear?: string;
} = {}) => {
    try {
        let queryConstraints = [where("resumeVerified", "==", true)];
        if (filters.major) {
            queryConstraints.push(where("major", "==", filters.major));
        }
        if (filters.classYear) {
            queryConstraints.push(where("classYear", "==", filters.classYear));
        }

        const querySnapshot = await getDocs(query(collection(db, 'users'), ...queryConstraints));

        const usersArray = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));

        return usersArray;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};


export const fetchOfficerStatus = async (uid: string) => {
    try {
        const officerStatusRef = doc(db, `/office-hours/officers-status/officers/${uid}`);
        const docSnap = await getDoc(officerStatusRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (err) {
        console.error("Error fetching officer status:", err);
        return null;
    }
};

export const addOfficeHourLog = async (data: OfficerStatus) => {
    const userDocCollection = collection(db, 'office-hours/officer-log/log');
    await addDoc(userDocCollection, data);
};

export const updateOfficerStatus = async (data: OfficerStatus) => {
    const officerDoc = doc(db, `office-hours/officers-status/officers/${data.uid}`);
    return setDoc(officerDoc, { signedIn: data.signedIn }, { merge: true });
};

export const incrementOfficeCount = async () => {
    const officeCountRef = doc(db, 'office-hours/officer-count');
    await updateDoc(officeCountRef, { "zachary-office": increment(1) });
}

export const decrementOfficeCount = async () => {
    const officeCountRef = doc(db, 'office-hours/officer-count');
    await updateDoc(officeCountRef, { "zachary-office": increment(-1) });
}

export const submitFeedback = async (feedback: string, userInfo: User) => {
    try {
        await addDoc(collection(db, 'feedback'), {
            message: feedback,
            userInfo: userInfo.publicInfo,
            timestamp: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return { success: false, error };
    }
};

export const getAllFeedback = async () => {
    const feedbackCol = collection(db, 'feedback');
    const feedbackSnapshot = await getDocs(feedbackCol);
    const feedbackList = feedbackSnapshot.docs.map(doc => ({
        id: doc.id,
        message: doc.data().message,
        user: doc.data().userInfo,
        Timestamp: doc.data().timestamp
    }));
    return feedbackList;
};
export const removeFeedback = async (feedbackId: string) => {
    const feedbackDoc = doc(db, 'feedback', feedbackId);
    await deleteDoc(feedbackDoc);
};
