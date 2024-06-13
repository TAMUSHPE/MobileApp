import { signInAnonymously } from "firebase/auth";
import { getPrivateUserData, getPublicUserData, getUser, getUserByEmail, initializeCurrentUserData, setPrivateUserData, setPublicUserData } from "../firebaseUtils";
import { auth, db, storage } from "../../config/firebaseConfig";
import { PrivateUserInfo, PublicUserInfo, User } from "../../types/user";
import { validateTamuEmail } from "../../helpers";
import { doc, setDoc } from "firebase/firestore";

beforeAll(async () => {
    await signInAnonymously(auth);

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
});

describe("User Info", () => {
    test("Initializes correctly and can be modified", async () => {
        expect((await getUserByEmail(auth.currentUser?.email!))).toBeNull();

        const user = await initializeCurrentUserData();
        expect(user).toBeDefined();

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

        setPublicUserData({
            email: auth.currentUser?.email!,
            isEmailPublic: true,
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
        console.debug(emailUserData?.userData);
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

