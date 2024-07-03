import { deleteUser, signInAnonymously, signOut } from "firebase/auth";
import { backupAndDeleteUserData, deleteAccount, deleteUserAuthentication, deleteUserStorageData, getPrivateUserData, getPublicUserData, getUser, getUserByEmail, initializeCurrentUserData, setPublicUserData } from "../firebaseUtils";
import { auth, db, storage } from "../../config/firebaseConfig";
import { PrivateUserInfo, PublicUserInfo, User } from "../../types/user";
import { validateTamuEmail } from "../../helpers";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { clearCollection } from "../../helpers/unitTestUtils";
import { listAll, ref, uploadString } from "firebase/storage";
const testUserDataList: User[] = require("./test_data/users.json");



beforeAll(async () => {
    // Check testing environment
    expect(process.env.FIREBASE_EMULATOR_ADDRESS).toBeDefined();
    expect(process.env.FIREBASE_AUTH_PORT).toBeDefined();
    expect(process.env.FIREBASE_CLOUD_FUNCTIONS_PORT).toBeDefined();
    expect(process.env.FIREBASE_FIRESTORE_PORT).toBeDefined();
    expect(process.env.FIREBASE_STORAGE_PORT).toBeDefined();
    expect(Number(process.env.FIREBASE_AUTH_PORT)).not.toBeNaN();
    expect(Number(process.env.FIREBASE_CLOUD_FUNCTIONS_PORT)).not.toBeNaN();
    expect(Number(process.env.FIREBASE_FIRESTORE_PORT)).not.toBeNaN();
    expect(Number(process.env.FIREBASE_STORAGE_PORT)).not.toBeNaN();

    await signInAnonymously(auth);
});

afterAll(async () => {
    await signOut(auth);
    clearCollection("users");
    clearCollection("deleted-accounts");
});


beforeEach(async () => {
    // Create fake user data
    for (const user of testUserDataList) {
        const userId = user.publicInfo!.uid!;

        for (let i = 0; i < 10; i++) {
            await setDoc(doc(db, "users", userId), user.publicInfo);
            await setDoc(doc(db, `users/${userId}/private`, "privateInfo"), user.private?.privateInfo);

            // Create mock event logs
            const eventLogsCollectionRef = collection(db, `users/${userId}/event-logs`);
            for (let j = 0; j < 3; j++) {
                await setDoc(doc(eventLogsCollectionRef, `eventLog${j}`), {
                    eventName: `Event ${j}`,
                    timestamp: new Date(),
                    details: `Details of event ${j}`
                });
            }

            // Verify data setup
            const userDoc = await getDoc(doc(db, `users/${userId}`));
            const privateDoc = await getDoc(doc(db, `users/${userId}/private/privateInfo`));
            const eventLogs = await getDocs(eventLogsCollectionRef);

            if (userDoc.exists() && privateDoc.exists() && eventLogs.size > 0) {
                break;
            } else if (i === 9) {
                throw new Error(`Failed to set up user data for ${userId}`);
            }
        }
    }
});

describe("User Info", () => {
    test("Initializes correctly and can be modified", async () => {
        // Create user data and ensure it initializes
        const user = await initializeCurrentUserData();
        expect(user).toBeDefined();

        // Initializing again should not modify user
        const initializedUserAgain = await initializeCurrentUserData();
        expect(initializedUserAgain).toMatchObject(user);

        const userData = await getUser(auth.currentUser?.uid!);
        expect(userData).toBeDefined();
        expect(user).toMatchObject<User>(userData!);


        expect(auth.currentUser?.uid).toBeDefined();
        expect(auth.currentUser?.email).toBeDefined();
        expect(auth.currentUser?.displayName).toBeDefined();
        expect(auth.currentUser?.photoURL).toBeDefined();

        const publicUserData = await getPublicUserData();
        expect(publicUserData).toMatchObject<PublicUserInfo>({
            isStudent: validateTamuEmail(auth.currentUser?.email!),
            displayName: auth.currentUser?.displayName!,
            photoURL: auth.currentUser?.photoURL ?? "",
            isEmailPublic: false,
        });

        const privateUserData = await getPrivateUserData();
        expect(privateUserData).toMatchObject<PrivateUserInfo>({
            completedAccountSetup: false,
            email: auth.currentUser!.email!
        });

        expect(publicUserData).toMatchObject<PublicUserInfo>(user.publicInfo!);
        expect(privateUserData).toMatchObject<PrivateUserInfo>(user.private?.privateInfo!);

        expect((await getUserByEmail(auth.currentUser?.email!))).toBeNull();

        // Modify user data and re-fetch data
        await setPublicUserData({
            email: auth.currentUser?.email!,
            isEmailPublic: true,
            displayName: "Test User",
            isStudent: false,
            photoURL: "",
            roles: {
                admin: false,
                developer: false,
                lead: false,
                officer: false,
                reader: true,
                representative: false
            }
        });

        const updatedPublicUserData = await getPublicUserData();
        expect(updatedPublicUserData).not.toMatchObject(publicUserData!);
        expect(updatedPublicUserData).toMatchObject({
            ...publicUserData,
            email: auth.currentUser?.email,
            isEmailPublic: true,
        });

        const emailUserData = await getUserByEmail(auth.currentUser?.email!);
        expect(emailUserData).not.toBeFalsy();
        expect(emailUserData).toMatchObject({
            userData: {
                ...publicUserData,
                email: auth.currentUser?.email,
                isEmailPublic: true,
            },
            userUID: auth.currentUser?.uid
        });
    }, 10000);

    test("Can be seen by other users", async () => {
        const otherUserUID = "1234567890";
        const otherUserData: PublicUserInfo = {
            name: "Test",
            email: "bob@tamu.edu",
        };

        await setDoc(doc(db, "users", otherUserUID), otherUserData);

        const publicUserData = await getPublicUserData(otherUserUID);
        expect(publicUserData).toMatchObject(otherUserData);
    });
});


describe("Account Deletion Functions", () => {
    test("Backup and Delete User Data", async () => {
        const user = testUserDataList[0];
        const userId = user.publicInfo!.uid!;

        for (let i = 0; i < 20; i++) {
            await setDoc(doc(db, "users", userId), user.publicInfo);
            await setDoc(doc(db, `users/${userId}/private`, "privateInfo"), user.private?.privateInfo);

            // Create mock event logs
            const eventLogsCollectionRef = collection(db, `users/${userId}/event-logs`);
            for (let j = 0; j < 3; j++) {
                await setDoc(doc(eventLogsCollectionRef, `eventLog${j}`), {
                    eventName: `Event ${j}`,
                    timestamp: new Date(),
                    details: `Details of event ${j}`
                });
            }

            // Verify data setup
            const userDoc = await getDoc(doc(db, `users/${userId}`));
            const privateDoc = await getDoc(doc(db, `users/${userId}/private/privateInfo`));
            const eventLogs = await getDocs(eventLogsCollectionRef);

            if (userDoc.exists() && privateDoc.exists() && eventLogs.size > 0) {
                break;
            } else if (i === 19) {
                throw new Error(`Failed to set up user data for ${userId}`);
            }
        }

        // Ensure user data exists before deletion
        const userDoc = await getDoc(doc(db, `users/${userId}`));
        expect(userDoc.exists()).toBe(true);

        const privateDoc = await getDoc(doc(db, `users/${userId}/private/privateInfo`));
        expect(privateDoc.exists()).toBe(true);

        const eventLogsCollectionRef = collection(db, `users/${userId}/event-logs`);
        const eventLogs = await getDocs(eventLogsCollectionRef);
        expect(eventLogs.size).toBeGreaterThan(0);

        await backupAndDeleteUserData(userId);

        // Check if data is backed up with retry logic
        let backupUserDoc, backupPrivateDoc, backupEventLogs;
        for (let i = 0; i < 20; i++) {
            backupUserDoc = await getDoc(doc(db, `deleted-accounts/${userId}`));
            backupPrivateDoc = await getDoc(doc(db, `deleted-accounts/${userId}/private/privateInfo`));
            const backupEventLogsCollectionRef = collection(db, `deleted-accounts/${userId}/event-logs`);
            backupEventLogs = await getDocs(backupEventLogsCollectionRef);

            if (backupUserDoc.exists() && backupPrivateDoc.exists() && backupEventLogs.size > 0) {
                break;
            } else if (i === 19) {
                throw new Error(`Failed to backup user data for ${userId}`);
            }

            // Wait for a short period before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        expect(backupUserDoc?.exists()).toBe(true);
        expect(backupPrivateDoc?.exists()).toBe(true);
        expect(backupEventLogs?.size).toBeGreaterThan(0);

        // Check if original data is deleted
        const deletedUserDoc = await getDoc(doc(db, `users/${userId}`));
        expect(deletedUserDoc.exists()).toBe(false);

        const deletedPrivateDoc = await getDoc(doc(db, `users/${userId}/private/privateInfo`));
        expect(deletedPrivateDoc.exists()).toBe(false);

        const deletedEventLogs = await getDocs(eventLogsCollectionRef);
        expect(deletedEventLogs.size).toBe(0);
    }, 30000);


    test("Delete User Storage Data", async () => {
        const userId = testUserDataList[0].publicInfo!.uid!;
        const userDocsRef = ref(storage, `user-docs/${userId}`);

        // Add a mock file to the user's storage
        const fileRef = ref(userDocsRef, 'mockFile.txt');
        await uploadString(fileRef, 'mock content');

        // Ensure the file exists before deletion
        const listResultsBefore = await listAll(userDocsRef);
        expect(listResultsBefore.items.length).toBeGreaterThan(0);

        await deleteUserStorageData(userId);

        // Verify the storage data is deleted
        const listResultsAfter = await listAll(userDocsRef);
        expect(listResultsAfter.items.length).toBe(0);
    }, 30000);

    test("Delete User Authentication", async () => {
        const userId = auth.currentUser!.uid;

        // Ensure user is authenticated before deletion
        expect(auth.currentUser).toBeDefined();

        await deleteUserAuthentication(userId);

        // Check if the user is deleted
        try {
            await deleteUser(auth.currentUser!);
        } catch (error) {
            expect(error).toBe('auth/requires-recent-login');
        }
    }, 30000);

});