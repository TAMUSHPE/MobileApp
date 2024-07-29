import crypto from "crypto";
import { DocumentReference, GeoPoint, Timestamp, collection, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import fs from 'fs';
import { db } from "../config/firebaseConfig";
import { PublicUserInfo, User } from "../types/user";
import { EventType, SHPEEvent } from "../types/events";
import { Committee } from "../types/committees";

/**
 * Options for random string generation.
 * @property {BufferEncoding} encoding - Indicates what encoding to use to interpret a random string of bytes. Defaults to utf8
 * @property {string} charSet          - String with characters to be used in generation. If defined, randomStr will use Math.random() instead of crypto.randomBytes(). This means the string will be much less random and thus less secure.
 */
type RandomStringOptions = {
    encoding?: BufferEncoding,
    charSet?: string
}

/**
 * Generates a pseudo-random string with a given length
 * @param length  - Length of string to be generated. Defaults to 1
 * @param options - Object containing various generation options.
 */
export const randomStr = (length: number = 1, options?: RandomStringOptions): string => {
    length = Math.trunc(length);
    const encoding = options?.encoding ?? "utf8";

    if (length < 0) {
        throw new Error("String length cannot be less than 0", { cause: "Argument 'length' in randomStr() is less than 0" });
    }

    if (options?.charSet) {
        const charSetLength = options.charSet.length;
        let result = "";

        for (let index = 0; index < length; index++) {
            result += options.charSet.charAt(Math.trunc(Math.random() * charSetLength));
        }
        return result;
    }
    else {
        // Creates random bytes and converts them to a string. Padding is used in case the length is odd.
        return crypto.randomBytes(Math.trunc(length / 2)).toString(encoding).padEnd(length, crypto.randomBytes(1).toString(encoding));
    }
};

/**
 * Generates a pseudo-random string with a given range of lengths
 * @param min - Minimum length of string. Defaults to 0
 * @param max - Maximum length of string. Defaults to 1
 * @throws When `min > max` or when `min < 0`
 */
export const randomStrRange = (min: number = 0, max: number = 1, options?: RandomStringOptions) => {
    min = Math.trunc(min);
    max = Math.trunc(max);
    if (min > max) {
        throw new Error("min cannot be greater than max", { cause: "'min' argument is greater than 'max' argument in randomStrRange()" })
    }
    else if (min < 0) {
        throw new Error("String length cannot be less than 0", { cause: "Argument 'min' in randomStrRange() is less than 0" });
    }
    const length = (Math.random() * (max - min)) + min;
    return randomStr(length, options);
};


/**
 * Generates a pseudo-random unsigned 8-byte integer array. 
 * @param size - Amount of random bytes to generate. Defaults to 100
*/
export const randomUint8Array = (size: number = 100): Uint8Array => {
    return new Uint8Array(crypto.randomBytes(size));
};


/**
 * Generates a given amount of test cases them to a JSON file as a list. Does not write to a file if it already exists.
 * @param dataFactory - Function that generates a single test case. 
 * @param file        - File path to write to.
 * @param amount      - Specified amount of test cases. Defaults to 100 
 * @param options     - Options to be passed into fs when writing to the file. Defaults to mode: { flag: "wx" }
 */
/* istanbul ignore next */
export const writeTestDataFile = <T>(dataFactory: () => T, file: string, amount: number = 100, options: fs.WriteFileOptions = { flag: "wx" }): void => {
    if (amount < 1) {
        throw new Error("Amount must be greater than or equal to 1", { cause: "argument amount < 1" })
    }

    const data: Array<T> = [];

    for (let i = 0; i < amount; i++) {
        data.push(dataFactory());
    }

    fs.writeFile(file, JSON.stringify(data, null, 4), options, (err) => {
        if (err)
            console.error(err);
        else
            console.log("File saved")
    });
};


export const generateTestCommittee = async (overrides: Partial<Committee> = {}): Promise<Committee> => {
    return {
        firebaseDocName: "test-committee",
        name: "Test Committee",
        color: "#500000",
        head: "head1UID",
        representatives: ["rep1UID", "rep2UID"],
        leads: ["lead1UID"],
        applicationLink: "http://testlink.com",
        logo: "default",
        memberCount: 10,
        isOpen: true,
        ...overrides
    };
};

export const generateTestEvent = (overrides: Partial<SHPEEvent> = {}): SHPEEvent => {
    const currentTime = new Date();
    const startTime = Timestamp.fromDate(currentTime);
    const endTime = Timestamp.fromDate(new Date(currentTime.getTime() + 3600 * 1000)); // 1 hour in the future

    return {
        committee: "app-devs",
        coverImageURI: null,
        creator: "sampleUID",
        description: "Test Description",
        endTime: endTime,
        endTimeBuffer: 600000,
        eventType: EventType.INTRAMURAL_EVENT,
        general: true,
        geofencingRadius: 100,
        geolocation: new GeoPoint(30.621160236499136, -96.3403560168198),
        hiddenEvent: false,
        locationName: "Test",
        name: "Test Event",
        nationalConventionEligible: true,
        notificationSent: true,
        signInPoints: 3,
        startTime: startTime,
        startTimeBuffer: 600000,
        ...overrides
    };
};

export const generateTestUsers = async (overrides: Partial<User> = {}): Promise<User> => {
    return {
        publicInfo: {
            uid: "testUID",
        },
        private: {
            privateInfo: {
                completedAccountSetup: true,
                settings: {
                    darkMode: true,
                    useSystemDefault: false
                },
            },
        },
        ...overrides
    };
};

export const createTestUserInFirebase = async (user: User, maxRetries: number = 20) => {
    const publicInfo = user.publicInfo;
    const privateInfo = user.private?.privateInfo;
    const userDocRef = doc(db, "users", publicInfo?.uid!);
    const privateInfoDocRef = doc(db, `users/${publicInfo?.uid!}/private`, "privateInfo");

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Attempt to set the documents in Firestore
            await setDoc(userDocRef, publicInfo);
            await setDoc(privateInfoDocRef, privateInfo);

            // Verify the creation of the user
            const testUserDoc = await getDoc(userDocRef);
            if (testUserDoc.exists()) {
                return;
            }
        } catch (error) {
            console.error(`Attempt ${attempt} encountered an error: ${error}. Retrying...`);
        }
    }
};

const userExists = async (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists();
};

export const waitForUser = async (uid: string, maxRetries: number = 16, interval: number = 500, userData?: PublicUserInfo) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (await userExists(uid)) {
            return true;
        }
        await createTestUserInFirebase({ publicInfo: userData ? (userData) : ({ uid: uid }) }, 4);
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`User with UID: ${uid} does not exist after ${maxRetries} attempts`);
};


const clearSubcollections = async (docRef: DocumentReference, retries = 5) => {
    while (retries > 0) {
        try {
            const subcollectionsSnapshot = await getDocs(collection(docRef, 'private'));
            const batch = writeBatch(db);

            subcollectionsSnapshot.forEach(subDoc => {
                batch.delete(subDoc.ref);
            });

            await batch.commit();
            return; // Exit if successful
        } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
};

export const clearCollection = async (collectionName: string, retries = 5) => {
    while (retries > 0) {
        try {
            const collectionRef = collection(db, collectionName);
            const querySnapshot = await getDocs(collectionRef);

            const batch = writeBatch(db);

            for (const documentSnapshot of querySnapshot.docs) {
                await clearSubcollections(documentSnapshot.ref);
                batch.delete(documentSnapshot.ref);
            }

            await batch.commit();
            return; // Exit if successful
        } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
};