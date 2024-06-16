import { auth, db, functions, storage } from "../config/firebaseConfig";
import { ref, uploadBytesResumable, UploadTask, UploadMetadata, listAll, deleteObject, getDownloadURL, uploadBytes } from "firebase/storage";
import { doc, setDoc, getDoc, arrayUnion, collection, where, query, getDocs, orderBy, addDoc, updateDoc, deleteDoc, Timestamp, limit, startAfter, Query, DocumentData, CollectionReference, QueryDocumentSnapshot, increment, runTransaction, deleteField, GeoPoint, writeBatch, DocumentSnapshot } from "firebase/firestore";
import { HttpsCallableResult, httpsCallable } from "firebase/functions";
import { validateFileBlob, validateTamuEmail } from "../helpers/validation";
import { OfficerStatus, PrivateUserInfo, PublicUserInfo, Roles, User, UserFilter } from "../types/user";
import { Committee } from "../types/committees";
import { SHPEEvent, EventLogStatus, UserEventData } from "../types/events";
import * as Location from 'expo-location';
import { deleteUser } from "firebase/auth";
import { LinkData } from "../types/links";
import { getBlobFromURI } from "./fileSelection";

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
            return responseData;
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
    if (!auth.currentUser?.uid) {
        throw new Error("Authentication Error", { cause: "Current user uid is undefined" });
    }

    await setDoc(doc(db, `users/${auth.currentUser?.uid!}/private`, "privateInfo"), data, { merge: true })
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

export const getUserForMemberList = async (options: FetchMembersOptions): Promise<{ members: QueryDocumentSnapshot<DocumentData, DocumentData>[] | never[]; lastSnapshot: QueryDocumentSnapshot<DocumentData, DocumentData> | null; hasMoreUser: boolean; }> => {
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
        email: "",
        isStudent: validateTamuEmail(auth.currentUser?.email, false) ? true : false,
        displayName: auth.currentUser?.displayName ?? "",
        photoURL: auth.currentUser?.photoURL ?? "",
        roles: {
            reader: true,
            officer: false,
            admin: false,
            developer: false,
            lead: false,
            representative: false,
        },
        isEmailPublic: false,
    };

    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const defaultPrivateInfo: PrivateUserInfo = {
        completedAccountSetup: false,
        settings: {
            darkMode: false,
        },
        expirationDate: Timestamp.fromDate(oneWeekFromNow),
        email: auth.currentUser?.email ?? "",
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
                email: user.publicInfo?.isEmailPublic ? auth.currentUser?.email || "" : "",
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


export const uploadFile = async (
    blob: Blob,
    validMimeTypes: string[] = [],
    storagePath: string,
    onSuccess: ((url: string) => Promise<void>) | null = null,
    onProgress: ((progress: number) => void) | null = null,
    setLoading: ((load: boolean) => void) | null = null
) => {
    if (validMimeTypes.length > 0 && !validateFileBlob(blob, validMimeTypes, true)) {
        if (setLoading !== null) {
            setLoading(false);
        }
        return;
    }

    const uploadTask = uploadFileToFirebase(blob, storagePath);

    uploadTask.on("state_changed",
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress !== null) {
                onProgress(progress);
            }
            console.log(`Upload is ${progress}% done`);
        },
        (error) => {
            if (setLoading !== null) {
                setLoading(false);
            }
            switch (error.code) {
                case "storage/unauthorized":
                    alert("File could not be uploaded due to user permissions.");
                    break;
                case "storage/canceled":
                    alert("File upload cancelled");
                    break;
                default:
                    alert("An unknown error has occurred");
                    break;
            }
        },
        async () => {
            try {
                const URL = await getDownloadURL(uploadTask.snapshot.ref);
                if (onSuccess !== null) {
                    await onSuccess(URL);
                }
            } catch (error) {
                console.error("Error in uploadFile:", error);
            } finally {
                if (setLoading !== null) {
                    setLoading(false);
                }
            }
        }
    );
};


export const getCommittees = async (): Promise<Committee[]> => {
    try {
        const committeeCollectionRef = collection(db, 'committees');
        const snapshot = await getDocs(committeeCollectionRef);
        const committees = snapshot.docs
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

export const getCommittee = async (firebaseDocName: string): Promise<Committee | null> => {
    try {
        const committeeDocRef = doc(db, 'committees', firebaseDocName);
        const docSnap = await getDoc(committeeDocRef);
        if (docSnap.exists()) {
            return {
                firebaseDocName: docSnap.id,
                ...docSnap.data()
            };
        } else {
            return null;
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}


export const setCommitteeData = async (committeeData: Committee) => {
    const headDocRef = doc(db, "users", committeeData.head ?? "");
    if (committeeData.head && !(await getDoc(headDocRef)).exists()) {
        throw new Error("Bad Head UID", { cause: `Invalid head UID: ${committeeData.head}. This user likely does not exist.` });
    }

    if (!committeeData.firebaseDocName) {
        throw new Error("Bad Document Name", { cause: `Invalid firebaseDocName passed: '${committeeData.firebaseDocName}'. Name is falsy` });
    }

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
            isOpen: committeeData.isOpen || false
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
                const userData = userDoc.data();
                if (Array.isArray(userData.committees) && userData.committees.includes(firebaseDocName)) {
                    const updatedCommittees = userData.committees.filter((committee: string) => committee !== firebaseDocName);
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
                const userCommittees = userDoc.data().committees;
                if (Array.isArray(userCommittees) && userCommittees.includes(firebaseDocName)) {
                    const updatedCommittees = userCommittees.filter((committee) => committee !== firebaseDocName);
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



/**
 * Updates a given event
 * @param id Name of event document in firestore
 * @param event Object to replace firestore document
 * @returns Document name firebase or null if an issue occurred
 */
export const setEvent = async (id: string, event: SHPEEvent): Promise<string | null> => {
    try {
        const docRef = doc(db, "events", id);
        await updateDoc(docRef, {
            ...event
        });
        return id;
    } catch (error) {
        console.error("Error updating document: ", error);
        return null;
    }
}

/**
 * Fetches a given event document from firestore
 * @param eventID Document name of event in firestore
 * @returns Document data from firestore. null if there is an issue obtaining document.
 */
export const getEvent = async (eventID: string): Promise<null | SHPEEvent> => {
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

export const getAttendanceNumber = async (eventId: string): Promise<number> => {
    try {
        const logsRef = collection(db, `events/${eventId}/logs`);
        const q = query(logsRef);
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.length;
    } catch (error) {
        console.error("Error calculating attendance number:", error);
        throw new Error("Unable to calculate attendance.");
    }
}

/**
 * Signs a user into an event given an event id
 * @param eventID ID of event to sign into. This is the name of the event document in firestore
 * @returns Status representing the status of the cloud function
 */
export const signInToEvent = async (eventID: string, uid?: string): Promise<EventLogStatus> => {
    const event = await getEvent(eventID);
    if (!event) {
        return EventLogStatus.EVENT_NOT_FOUND;
    }

    let location: null | { longitude: number, latitude: number } = null;

    if (event.geofencingRadius && event.geofencingRadius > 0) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status == 'granted') {
            const { latitude, longitude } = (await Location.getCurrentPositionAsync()).coords;
            location = (new GeoPoint(latitude, longitude)).toJSON();
        }
    }

    return await httpsCallable(functions, "eventSignIn")
        .call(null, { eventID, location, uid })
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
                case 'functions/out-of-range':
                    return EventLogStatus.OUT_OF_RANGE;
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
export const signOutOfEvent = async (eventID: string, uid?: string): Promise<EventLogStatus> => {
    const event = await getEvent(eventID);
    if (!event) {
        return EventLogStatus.EVENT_NOT_FOUND;
    }

    let location: null | { longitude: number, latitude: number } = null;

    if (event.geofencingRadius && event.geofencingRadius > 0) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status == 'granted') {
            const { latitude, longitude } = (await Location.getCurrentPositionAsync()).coords;
            location = (new GeoPoint(latitude, longitude)).toJSON();
        }
    }

    return await httpsCallable(functions, "eventSignOut")
        .call(null, { eventID, location, uid })
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
                case 'functions/out-of-range':
                    return EventLogStatus.OUT_OF_RANGE;
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

export const getMOTM = async () => {
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

export const setMOTM = async (member: PublicUserInfo) => {
    try {
        await setDoc(doc(db, `member-of-the-month/member`), {
            member: member
        }, { merge: true });

        const pastMembersRef = doc(db, "member-of-the-month", "past-members");
        await updateDoc(pastMembersRef, {
            members: arrayUnion(member.uid)
        });
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


export const getUsers = async (): Promise<PublicUserInfo[]> => {
    try {
        const userRef = collection(db, 'users');
        const querySnapshot = await getDocs(userRef);
        const members: PublicUserInfo[] = querySnapshot.docs.map((doc) => ({
            ...doc.data() as PublicUserInfo,
            uid: doc.id,
        }));

        return members;

    } catch (error) {
        console.error("Error fetching members:", error);
        throw new Error("Internal Server Error.");
    }
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
    const memberSHPEQuery = query(memberSHPERef, where('nationalURL', '!=', ''));
    const memberSHPESnapshot = await getDocs(memberSHPEQuery);


    const members: PublicUserInfo[] = [];
    for (const document of memberSHPESnapshot.docs) {
        const memberSHPEData = document.data();
        if (memberSHPEData.chapterURL && memberSHPEData.nationalURL) {
            const userId = document.id;
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                members.push({ uid: userId, ...userDocSnap.data() });
            }

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

export const getMembersToShirtVerify = async (): Promise<{ pickedUp: PublicUserInfo[], notPickedUp: PublicUserInfo[] }> => {
    try {
        const querySnapshot = await getDocs(collection(db, "shirt-sizes"));
        const UIDs: string[] = [];

        querySnapshot.forEach(doc => {
            UIDs.push(doc.id);
        });

        const pickedUpMembers: PublicUserInfo[] = [];
        const notPickedUpMembers: PublicUserInfo[] = [];

        for (const uid of UIDs) {
            const userData = await getPublicUserData(uid);
            const shirtData = await getDoc(doc(db, "shirt-sizes", uid));
            const shirtPickedUp = shirtData.data()?.shirtPickedUp;

            if (userData) {
                const memberData = { uid, ...userData };
                if (shirtPickedUp) {
                    pickedUpMembers.push(memberData);
                } else {
                    notPickedUpMembers.push(memberData);
                }
            }
        }

        return { pickedUp: pickedUpMembers, notPickedUp: notPickedUpMembers };
    } catch (error) {
        console.error("Error fetching members for shirt verification:", error);
        return { pickedUp: [], notPickedUp: [] };
    }
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

export const getCommitteeEvents = async (committees: string[]) => {
    try {
        let allEvents = new Map<string, any>(); // Using a Map to handle uniqueness
        const currentTime = Timestamp.now();

        const eventsRef = collection(db, 'events');

        // Pre-fetching committee data to avoid duplicate calls in the loop
        const committeesData = await Promise.all(committees.map(committee => getCommittee(committee)));

        for (const committee of committees) {
            try {
                const committeeData = committeesData.find(data => data?.firebaseDocName === committee);
                const eventsQuery = query(
                    eventsRef,
                    where("committee", "==", committee),
                    where("endTime", ">=", currentTime)
                );
                const querySnapshot = await getDocs(eventsQuery);
                querySnapshot.forEach((doc) => {
                    const eventData = doc.data();
                    const eventWithCommitteeData = { id: doc.id, ...eventData, committeeData: committeeData };

                    // Using Map to avoid duplicates
                    allEvents.set(doc.id, eventWithCommitteeData);
                });
            } catch (innerError) {
                console.error(`Error fetching events for committee ${committee}:`, innerError);
            }
        }

        // Convert Map values to an array
        return Array.from(allEvents.values());
    } catch (error) {
        console.error("Error fetching events for user committees:", error);
        return [];
    }
}

export const getInterestsEvent = async (interests: string[]) => {
    try {
        let allEvents = new Map<string, any>(); // Using a Map to handle uniqueness
        const currentTime = Timestamp.now();

        const eventsRef = collection(db, 'events');

        for (const interest of interests) {
            try {
                const eventsQuery = query(
                    eventsRef,
                    where("eventType", "==", interest),
                    where("endTime", ">=", currentTime)
                );
                const querySnapshot = await getDocs(eventsQuery);
                querySnapshot.forEach((doc) => {
                    const eventData = doc.data();
                    const eventDataWithId = { id: doc.id, ...eventData };

                    // Using Map to avoid duplicates
                    allEvents.set(doc.id, eventDataWithId);
                });
            } catch (innerError) {
                console.error(`Error fetching events for committee ${interests}:`, innerError);
            }
        }

        // Convert Map values to an array
        return Array.from(allEvents.values());
    } catch (error) {
        console.error("Error fetching events for user committees:", error);
        return [];
    }
}

const backupAndDeleteUserData = async (userId: string) => {
    const userDocRef = doc(db, `users/${userId}`);
    const backupUserDocRef = doc(db, `deleted-accounts/${userId}`);
    const batch = writeBatch(db);

    // Backup user data
    const userData = await getDoc(userDocRef);
    if (userData.exists()) {
        batch.set(backupUserDocRef, userData.data());
    }

    // Backup and delete Private Info
    const privateInfoDocRef = doc(db, `users/${userId}/private/privateInfo`);
    const privateData = await getDoc(privateInfoDocRef);
    if (privateData.exists()) {
        const backupPrivateInfoDocRef = doc(db, `deleted-accounts/${userId}/private/privateInfo`);
        batch.set(backupPrivateInfoDocRef, privateData.data());
        batch.delete(privateInfoDocRef);
    }

    // Backup and delete Event Logs
    const eventLogsCollectionRef = collection(db, `users/${userId}/event-logs`);
    const eventLogs = await getDocs(eventLogsCollectionRef);
    eventLogs.forEach((document) => {
        const backupEventLogDocRef = doc(db, `deleted-accounts/${userId}/event-logs/${document.id}`);
        batch.set(backupEventLogDocRef, document.data());
        batch.delete(doc(db, `users/${userId}/event-logs/${document.id}`));
    });

    batch.delete(userDocRef);
    await batch.commit();
};

const deleteUserStorageData = async (userId: string) => {
    const userDocsRef = ref(storage, `user-docs/${userId}`);

    try {
        const listResults = await listAll(userDocsRef);
        listResults.items.forEach(async (itemRef) => {
            await deleteObject(itemRef);
        });
    } catch (error) {
        console.log('Error deleting user storage data:', error);
    }
};

const deleteUserAuthentication = async (userId: string) => {
    try {
        if (auth.currentUser) {
            await deleteUser(auth.currentUser);
        } else {
            console.log('No user currently logged in or user not found.');
        }
    } catch (error) {
        console.error('Error deleting user authentication:', error);
    }
};

export const deleteAccount = async (userId: string) => {
    try {
        await backupAndDeleteUserData(userId);
        await deleteUserStorageData(userId);
        await deleteUserAuthentication(userId);

        console.log('Successfully deleted account for user:', userId);
    } catch (error) {
        console.error('Error deleting account:', error);
    }
};

export const queryUserEventLogs = async (uid: string, limitNum: number = 3): Promise<Array<UserEventData>> => {
    console.log(`users/${uid}/event-logs`);
    const userEventLogsCollectionRef = collection(db, `users/${uid}/event-logs`);
    const q = query(userEventLogsCollectionRef, orderBy('signInTime', 'desc'), limit(limitNum));
    const eventLogSnapshot = await getDocs(q);
    const docPromises: Array<Promise<DocumentSnapshot>> = [];
    const events: Array<UserEventData> = [];

    eventLogSnapshot.forEach((eventLog) => {
        events.push({ eventLog: eventLog.data() });
        docPromises.push(getDoc(doc(db, "events", eventLog.id)));
    });

    for (let index = 0; index < docPromises.length; index++) {
        const document = docPromises[index];
        const eventData = (await document).data() as SHPEEvent;
        events[index].eventData = eventData;
    }

    return events;
}


export const updateLink = async (linkData: LinkData) => {
    const linkRef = doc(db, 'links', linkData.id);
    let imageUrl = linkData.imageUrl || '';

    // If there is an image to upload
    if (linkData.imageUrl && linkData.imageUrl.startsWith('file://')) {
        const imageRef = ref(storage, `links/${linkData.name}`);
        const blob = await getBlobFromURI(linkData.imageUrl);

        if (blob) {
            await uploadBytes(imageRef, blob);
            imageUrl = await getDownloadURL(imageRef);
        }
    }


    const linkToSave: LinkData = {
        id: linkData.id,
        name: linkData.name,
        url: linkData.url,
        imageUrl: imageUrl,
    };

    await setDoc(linkRef, linkToSave, { merge: true });
};


export const fetchLink = async (linkID: string): Promise<LinkData | null> => {
    try {
        const linkRef = doc(db, 'links', linkID);
        const linkDoc = await getDoc(linkRef);

        if (linkDoc.exists()) {
            return linkDoc.data() as LinkData;
        } else {
            console.log('No such document!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching document:', error);
        return null;
    }
};

export const getMembers = async (): Promise<PublicUserInfo[]> => {
    try {
        const userRef = collection(db, 'users');
        const q = query(userRef);
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const members = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const publicInfo = doc.data();
            const uid = doc.id;

            return {
                ...publicInfo,
                uid,
            };
        }));

        return members;

    } catch (error) {
        console.error("Error fetching members:", error);
        throw new Error("Internal Server Error.");
    }
};

export const fetchEventByName = async (eventName: string): Promise<SHPEEvent | null> => {
    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('name', '==', eventName), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const eventDoc = querySnapshot.docs[0];
            return { id: eventDoc.id, ...eventDoc.data() } as SHPEEvent;
        } else {
            console.log(`Event with name "${eventName}" not found.`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching event:', error);
        return null;
    }
};


// ============================================================================
// Event Utilities
// ============================================================================

export const getUpcomingEvents = async () => {
    const currentTime = new Date();
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("endTime", ">", currentTime));
    const querySnapshot = await getDocs(q);
    const events: SHPEEvent[] = [];

    for (const doc of querySnapshot.docs) {
        const eventData = doc.data();
        events.push({ id: doc.id, ...eventData });
    }

    events.sort((a, b) => {
        const dateA = a.startTime ? a.startTime.toDate() : undefined;
        const dateB = b.startTime ? b.startTime.toDate() : undefined;

        return dateA && dateB ? dateA.getTime() - dateB.getTime() : -1;
    });

    return events;
};

export const getPastEvents = async (numLimit?: number) => {
    const currentTime = new Date();
    const eventsRef = collection(db, "events");
    let q;

    if (numLimit !== undefined) {
        q = query(eventsRef, where("endTime", "<", currentTime), orderBy("endTime", "desc"), limit(numLimit));
    } else {
        q = query(eventsRef, where("endTime", "<", currentTime), orderBy("endTime", "desc"));
    }

    const querySnapshot = await getDocs(q);
    const events: SHPEEvent[] = [];

    for (const doc of querySnapshot.docs) {
        const eventData = doc.data();
        events.push({ id: doc.id, ...eventData });
    }

    // Events are already ordered by endTime due to the query, no need to sort again
    return events;
};

/**
 * Creates a new SHPE event document in firestore
 * @param event Object with event details
 * @returns Document name in firestore. Null if error occurred
 */
export const createEvent = async (event: SHPEEvent): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, "events"), { ...event });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
};