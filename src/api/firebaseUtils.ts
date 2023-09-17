import { auth, db, storage } from "../config/firebaseConfig";
import { ref, uploadBytesResumable, UploadTask, UploadMetadata } from "firebase/storage";
import { doc, setDoc, getDoc, arrayUnion, collection, where, query, getDocs, orderBy, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { memberPoints } from "./fetchGoogleSheets";
import { PrivateUserInfo, PublicUserInfo, PublicUserInfoUID, User } from "../types/User";
import { Committee } from "../types/Committees";
import { SHPEEvent, SHPEEventID, EventLogStatus } from "../types/Events";
import { validateTamuEmail } from "../helpers/validation";


/**
 * Obtains the public information of a user given their UID.
 * 
 * @param uid - The universal ID tied to a registered user.
 * @returns - Promise of data. An undefined return means that the file does not exist or the user does not have permissions to access the document.
 */
export const getPublicUserData = async (uid: string): Promise<PublicUserInfo | undefined> => {
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
 * Obtains the private data of a user given their UID. Returns undefined if the currently logged-in user does not have permissions.
 * 
 * @param uid - Universal ID tied to a registered user.
 * @returns - Promise of data. An undefined return means that the file does not exist or the user does not have permissions to access the document.
 */
export const getPrivateUserData = async (uid: string): Promise<PrivateUserInfo | undefined> => {
    if (auth.currentUser?.uid != uid) return undefined;

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
 * Obtains all data related to a user. Any undefined fields mean the currently logged-in user does not have permissions to those fields.
 * 
 * @param uid - Universal ID tied to a registered user.
 * @returns - User data formatted according to User interface defined in "./src/types/User.tsx".
 */
export const getUser = async (uid: string): Promise<User | undefined> => {
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

export const getOfficers = async (): Promise<PublicUserInfoUID[]> => {
    try {
        const userRef = collection(db, 'users');
        const q = query(
            userRef,
            where("roles.officer", "==", true),
            orderBy("name")
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        const officers = querySnapshot.docs.map((doc) => {
            return {
                ...doc.data(),
                uid: doc.id
            }
        });

        return officers;

    } catch (error) {
        console.error("Error fetching officers:", error);
        throw new Error("Internal Server Error.");
    }
}

export const getMembersExcludeOfficers = async (): Promise<PublicUserInfoUID[]> => {
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

/**
 * Sets the public data of the currently logged-in user. This data is readable by anyone.
 * 
 * @param data - The data to be stored as public data. Any pre-existing fields in Firestore will not be removed.
 */
export const setPublicUserData = async (data: PublicUserInfo) => {
    await setDoc(doc(db, "users", auth.currentUser?.uid!), data, { merge: true })
        .catch(err => console.error(err));
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
 * @returns - User data formatted according to User interface defined in "./src/types/User.tsx".
 */
export const initializeCurrentUserData = async (): Promise<User> => { 

    /**
     * Both defaultPublicInfo and defaultPrivateInfo contain critical information used for the app to work as intended.
     * Should any values not exist in the returned object from firebase, the default data will be used instead.
     */
    const defaultPublicInfo: PublicUserInfo = {
        email: auth.currentUser?.email ?? "",
        tamuEmail: validateTamuEmail(auth.currentUser?.email) ? auth.currentUser!.email! : "",
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
export const uploadFileToFirebase = (file: Blob, path: string, metadata?: UploadMetadata): UploadTask => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    return uploadTask;
};

export const getCommitteeInfo = async (committeeName: string) => {
    return getDoc(doc(db, `committees/${committeeName}`))
        .then((res) => {
            const responseData = res.data()
            if (responseData) {
                return {
                    description: responseData?.description,
                    headUID: responseData?.headUID,
                    leadUIDs: responseData?.leadUIDs,
                    memberCount: responseData?.memberCount,
                    memberApplicationLink: responseData?.memberApplicationLink,
                    leadApplicationLink: responseData?.leadApplicationLink,
                } as Committee;
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

export const setCommitteeInfo = async (committeeName: string, committeeData: Committee) => {
    try {
        await setDoc(doc(db, `committees/${committeeName}`), {
            description: committeeData.description,
            headUID: committeeData.headUID,
            leadUIDs: committeeData.leadUIDs,
            memberApplicationLink: committeeData.memberApplicationLink,
            leadApplicationLink: committeeData.leadApplicationLink,
        }, { merge: true });
        return true;
    } catch (err) {
        console.error(err);
        return false;
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
            attendance: 0, 
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
};
export const updateEvent = async (event:SHPEEventID) => {
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
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.log("Error getting document:", error);
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

    const logRef = collection(eventRef, "log");
    const logQuery = query(logRef);
    const logSnapshot = await getDocs(logQuery);
    const deleteLogPromises = logSnapshot.docs.map((logDoc) => {
      return deleteDoc(logDoc.ref);
    });


    await Promise.all(deleteLogPromises);
    await deleteDoc(eventRef);
    return true;
  } catch (error) {
    console.error("Error deleting event and log: ", error);
    return false;
  }
}


const isEventActive = async (eventId: string) => {
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
                    return null
                }
            }
        }
    } catch (error) {
        console.error("Error checking event active status: ", error);
    }
    return EventLogStatus.ERROR;
};


export const addEventLog = async (eventId: string) => {
    const isActive = await isEventActive(eventId);
    if (isActive) return isActive;
    
    try {
        const logDoc = doc(db, `events/${eventId}/logs/${auth.currentUser?.uid!}`);
        const logDocRef = await getDoc(logDoc);

        const eventDoc = doc(db, `events/${eventId}`);
        const eventDocRef = await getDoc(eventDoc);

        
        if (!logDocRef.exists()) {
            await setDoc(logDoc, { signedInTime: serverTimestamp() }, { merge: true });
            
            const eventDoc = doc(db, 'events', eventId);
            const eventDocRef = await getDoc(eventDoc);

            if (eventDocRef.exists()) {
                const currentCount = eventDocRef.data().attendance || 0;
                await updateDoc(eventDoc, { attendance: currentCount + 1 });
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

export const isUserSignedIn = async (eventId: string, uid:string) => {
    const eventLogDocRef = doc(db, 'events', eventId, 'logs', uid);
    const docSnap = await getDoc(eventLogDocRef);

    if (docSnap.exists()) {
      return true;
    } else {
      return false;
    }
  }