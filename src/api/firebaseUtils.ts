import { auth, db, storage } from "../config/firebaseConfig";
import { ref, uploadBytesResumable, UploadTask, UploadMetadata } from "firebase/storage";
import { doc, setDoc, getDoc, arrayUnion, collection, where, query, getDocs, orderBy } from "firebase/firestore";
import { memberPoints } from "./fetchGoogleSheets";
import { PrivateUserInfo, PublicUserInfo, PublicUserInfoUID, User } from "../types/User";
import { Committee } from "../types/Committees";
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