import { auth, db, storage } from "../config/firebaseConfig";
import { ref, uploadBytesResumable, UploadTask, UploadMetadata } from "firebase/storage";
import { doc, setDoc, getDoc, addDoc, collection} from "firebase/firestore";
import { PrivateUserInfo, PublicUserInfo, User } from "../types/User";
import { OfficerStatus } from "../types/OfficerSIgnIn";

/**
 * Obtains the public information of a user given their UID.
 * @param uid 
 * Universal ID tied to a registered user.
 * @returns
 * Promise of data. An undefined return means that the file does not exist or the user does not have permissions to access the document.
 */
export const getPublicUserData = async (uid: string): Promise<PublicUserInfo | undefined> => {
    return getDoc(doc(db, "users", uid))
        .then((res) => {
            const responseData = res.data()
            if (responseData) {
                return {
                    email: responseData?.email,
                    displayName: responseData?.displayName,
                    photoURL: responseData?.photoURL,
                    roles: responseData?.roles,
                }
            }
            else {
                return responseData;
            }
        })
        .catch(err => {
            console.error(err);
            return undefined;
        });
};

/**
 * Obtains the private data of a user given their UID. If the currently logged in user does not have permissions, returns undefined.
 * @returns 
 * Promise of data. An undefined return means that the file does not exist or the user does not have permissions to access the document.
 */
export const getPrivateUserData = async (uid: string): Promise<PrivateUserInfo | undefined> => {
    return await getDoc(doc(db, `users/${uid}/private`, "privateInfo"))
        .then((res) => {
            const responseData = res.data()
            if (responseData) {
                return {
                    completedAccountSetup: responseData?.completedAccountSetup,
                    settings: responseData?.settings,
                }
            }
            else {
                return undefined;
            }
        })
        .catch(err => {
            console.error(err);
            return undefined;
        });
};

/**
 * Obtains all data related to a user. Any undefined fields mean the currently logged in user does not have permissions to those fields.
 * @param uid 
 * Universal ID tied to a registered user.
 * @returns 
 * User data formatted according to User interface defined in "./src/types/User.tsx".
 */
export const getUser = async (uid: string): Promise<User | undefined> => {
    const publicData = await getPublicUserData(uid);
    const privateData = await getPrivateUserData(uid);
    if (publicData == undefined) {
        return undefined;
    }
    else {
        return {
            publicInfo: publicData!,
            private: {
                privateInfo: privateData,
            },
        };
    }
};

/**
 * Sets the public data of the currently logged in user. This data is readable by anyone.
 * @param data
 * Data to be stored as the public data. Any pre-existing fields in firestore will not be removed.
 */
export const setPublicUserData = async (data: PublicUserInfo) => {
    await setDoc(doc(db, "users", auth.currentUser?.uid!), data, { merge: true })
        .catch(err => console.log(err));
};

/**
 * Sets the private data of the currently logged in user. This data is readable by only the user.
 * @param data 
 * Data to be stored as the private data. Any pre-existing fields in firestore will not be removed.
 */
export const setPrivateUserData = async (data: PrivateUserInfo) => {
    await setDoc(doc(db, `users/${auth.currentUser?.uid!}/private`, "privateInfo"), data, { merge: true })
        .catch(err => console.error(err));
};

/**
 * This function obtains information on the current user. If this information is undefined, creates a default user.
 */
export const initializeCurrentUserData = async (): Promise<User> => {
    const defaultPublicInfo: PublicUserInfo = {
        email: auth.currentUser?.email || "",
        displayName: auth.currentUser?.displayName || "",
        photoURL: auth.currentUser?.photoURL || "",
        roles: {
            reader: true,
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
        await setPublicUserData(defaultPublicInfo);
        await setPrivateUserData(defaultPrivateInfo);
        return {
            publicInfo: defaultPublicInfo,
            private: {
                privateInfo: defaultPrivateInfo,
            },
        };
    }
    else {
        return user;
    }
};

/**
 * Uploads a file blob to firebase given a url. Taken from: https://firebase.google.com/docs/storage/web/upload-files
 * @param file
 * File blob to be uploaded.
 * @param path 
 * Path name of file in firebase.
 * @returns
 * Task of file being uploaded.
 */
export const uploadFileToFirebase = (file: Blob, path: string, metadata?: UploadMetadata): UploadTask => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    return uploadTask;
};

