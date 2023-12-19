import { auth, db, functions, storage } from "../config/firebaseConfig";
import { ref, uploadBytesResumable, UploadTask, UploadMetadata } from "firebase/storage";
import { doc, setDoc, getDoc, arrayUnion, collection, where, query, getDocs, orderBy, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp, limit, startAfter, Query, DocumentData, CollectionReference } from "firebase/firestore";
import { memberPoints } from "./fetchGoogleSheets";
import { PrivateUserInfo, PublicUserInfo, Roles, User } from "../types/User";
import { Committee } from "../types/Committees";
import { SHPEEvent, SHPEEventID, EventLogStatus } from "../types/Events";
import { validateTamuEmail } from "../helpers/validation";
import { HttpsCallableResult, httpsCallable } from "firebase/functions";


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



type UserFilter = {
    classYear: string,
    major: string,
    orderByField: string
}
type FetchMembersOptions = {
    lastUserSnapshot?: any,
    isOfficer?: boolean,
    numLimit?: number | null, 
    filter: UserFilter,
};



export const fetchUserForList = async (options: FetchMembersOptions) => {
    const {
        lastUserSnapshot = null,
        isOfficer = false,
        numLimit = null, 
        filter,
    } = options;
    let userQuery: Query<DocumentData, DocumentData> = collection(db, 'users');

    userQuery = query(userQuery, where("roles.officer", "==", isOfficer));

    if (filter.classYear != "") {
        userQuery = query(userQuery, where("classYear", "==", filter.classYear));
    }

    if (filter.major != "") {
        userQuery = query(userQuery, where("major", "==", filter.major));
    }

    userQuery = query(userQuery, orderBy(filter.orderByField));
    
    if (numLimit !== null) {
        userQuery = query(userQuery, limit(numLimit));
    }

    if (lastUserSnapshot) {
        userQuery = query(userQuery, startAfter(lastUserSnapshot));
    }   

    try {
        const snapshot = await getDocs(userQuery);
        let hasMoreUser = numLimit !== null ? snapshot.docs.length === numLimit : false;
        
        const memberUID = snapshot.docs.map(doc => {
            return doc.id 
        });

        return { members: snapshot.docs, uid: memberUID, hasMoreUser };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { members: [], hasMoreUser: false };
    }
}

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

    const defaultPrivateInfo: PrivateUserInfo = {
        completedAccountSetup: false,
        settings: {
            darkMode: false,
        },
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
            .filter(doc => doc.id !== "committeeCounts") 
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
            color: committeeData.color || "#fff",
            description: committeeData.description || "",
            head: committeeData.head || "",
            leads: committeeData.leads || [],
            memberApplicationLink: committeeData.memberApplicationLink || "",
            leadApplicationLink: committeeData.leadApplicationLink || "",
            logo: committeeData.logo || "default",

        }, { merge: true });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const deleteCommittee = async (firebaseDocName: string): Promise<void> => {
    try {
        const committeeRef = doc(db, `committees/${firebaseDocName}`);
        await deleteDoc(committeeRef);
        console.log(`Committee with ID ${firebaseDocName} has been deleted.`);
    } catch (error) {
        console.error(`Error deleting committee with ID ${firebaseDocName}:`, error);
        throw new Error(`Error deleting committee: ${error}`);
    }
};

export const getWatchlist = async () => {
    const docRef = doc(db, "restrictions/watchlist");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().UIDs : [];
};

export const getBlacklist = async () => {
    const docRef = doc(db, "restrictions/blacklist");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().UIDs : [];
};


export const addToWatchlist = async (uid: string) => {
    const currentWatchlist = await getWatchlist() || [];
    if (!currentWatchlist.includes(uid)) {
        const updatedWatchlist = [...currentWatchlist, uid];
        await setDoc(doc(db, "restrictions/watchlist"), { UIDs: updatedWatchlist }, { merge: true });
    }
};

export const addToBlacklist = async (uid: string) => {
    const currentBlacklist = await getBlacklist() || [];
    if (!currentBlacklist.includes(uid)) {
        const updatedBlacklist = [...currentBlacklist, uid];
        await setDoc(doc(db, "restrictions/blacklist"), { UIDs: updatedBlacklist }, { merge: true });
    }
};

export const createEvent = async (event: SHPEEvent) => {
    try {
        const docRef = await addDoc(collection(db, "events"), {
            name: event.name,
            description: event.description,
            pointsCategory: event.pointsCategory,
            notificationGroup: event.notificationGroup,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
        });

        await setDoc(doc(db, `events/${docRef.id}/summaries/default`), {
            attendance: 0
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
};

export const updateEvent = async (event: SHPEEventID) => {
    try {
        const docRef = doc(db, "events", event.id!);
        await updateDoc(docRef, {
            name: event.name,
            description: event.description,
            pointsCategory: event.pointsCategory || [],
            notificationGroup: event.notificationGroup || [],
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
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
            return eventDoc.data() as SHPEEventID;
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
    const q = query(eventsRef, where("endDate", ">", currentTime));
    const querySnapshot = await getDocs(q);
    const events: SHPEEventID[] = [];
    querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
    });

    events.sort((a, b) => {
        const dateA = a.startDate ? a.startDate.toDate() : undefined;
        const dateB = b.startDate ? b.startDate.toDate() : undefined;

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
    const q = query(eventsRef, where("endDate", "<", currentTime));
    const querySnapshot = await getDocs(q);
    const events: SHPEEventID[] = [];
    querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
    });
    events.sort((a, b) => {
        const dateA = a.startDate ? a.startDate.toDate() : undefined;
        const dateB = b.startDate ? b.startDate.toDate() : undefined;

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
                    return EventLogStatus.EVENT_ONGOING
                }
            }
        }
    } catch (error) {
        console.error("Error checking event active status: ", error);
    }
    return EventLogStatus.ERROR;
};

export const  getAttendanceNumber = async (eventId: string): Promise<number | null> => {
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


export const addEventLog = async (eventId: string): Promise<EventLogStatus> => {
    const status = await getEventStatus(eventId);
    if (status != EventLogStatus.EVENT_ONGOING) {
        return status;
    }

    try {
        const logDoc = doc(db, `events/${eventId}/logs/${auth.currentUser?.uid!}`);
        const logDocRef = await getDoc(logDoc);

        const summaryDoc = doc(db, `events/${eventId}/summaries/default`);
        const summaryDocRef = await getDoc(summaryDoc);


        if (!logDocRef.exists()) {
            await setDoc(logDoc, { signedInTime: serverTimestamp() }, { merge: true });

            if (!summaryDocRef.exists()) {
                await setDoc(summaryDoc, { attendance: 1 });
                return EventLogStatus.SUCCESS;
            } else {
                const currentCount = summaryDocRef.data().attendance || 0;
                await updateDoc(summaryDoc, { attendance: currentCount + 1 });
                return EventLogStatus.SUCCESS;
            }
        } else {
            return EventLogStatus.ALREADY_LOGGED;
        }

    } catch (e) {
        console.error("Error adding log: ", e);
    }

    return EventLogStatus.ERROR;
};

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
            const responseData = res.data()
            if (responseData) {
                return { uid: responseData?.uid, name: responseData?.name };
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

export const setMemberOfTheMonth = async (uid: string, name: string) => {
    try {
        await setDoc(doc(db, `member-of-the-month/member`), {
            uid: uid,
            name: name
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


export const getMembersToVerify = async (): Promise<PublicUserInfo[]> => {
    const memberSHPERef = collection(db, 'memberSHPE');
    const memberSHPEQuery = query(memberSHPERef);
    const memberSHPESnapshot = await getDocs(memberSHPEQuery);
    const memberSHPEUserIds = memberSHPESnapshot.docs.map(doc => doc.id);
  
    const members:PublicUserInfo[] = [];
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
  
    const members:PublicUserInfo[] = [];
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
        let publicResumeQueryConstraints  = [where("resumeVerified", "==", true)];
        if (filters.major) {
            publicResumeQueryConstraints.push(where("major", "==", filters.major));
        }
        if (filters.classYear) {
            publicResumeQueryConstraints.push(where("classYear", "==", filters.classYear));
        }
        const publicResumeQuery = query(collection(db, 'users'), ...publicResumeQueryConstraints)
        const publicResumeSnapshot = await getDocs(publicResumeQuery);


        let officerQueryConstraints = [where("roles.officer", "==", true)];
        if (filters.major) {
            officerQueryConstraints.push(where("major", "==", filters.major));
        }
        if (filters.classYear) {
            officerQueryConstraints.push(where("classYear", "==", filters.classYear));
        }
        const officerQuery = query(collection(db, 'users'), ...officerQueryConstraints)
        const officerSnapshot = await getDocs(officerQuery);

        const combinedUsers = new Map();
        publicResumeSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.resumePublicURL) { 
                combinedUsers.set(doc.id, { ...userData, uid: doc.id });
            }
        });
        officerSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.resumePublicURL) { 
                combinedUsers.set(doc.id, { ...userData, uid: doc.id });
            }
        });

        const usersArray = Array.from(combinedUsers.values());

        return usersArray;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

