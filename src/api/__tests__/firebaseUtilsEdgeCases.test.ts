import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import { getPrivateUserData, getPublicUserData, setCommitteeData, setPrivateUserData, setPublicUserData } from "../firebaseUtils";
import { User } from "../../types/user";

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

    // Create fake user data
    for (const user of testUserDataList) {
        await setDoc(doc(db, "users", user.publicInfo!.uid!), user.publicInfo);
        await setDoc(doc(db, `users/${user.publicInfo!.uid!}/private`, "privateInfo"), user.private?.privateInfo);
    }
});

test("Getter functions throw errors when user is unauthenticated", async () => {
    expect(auth.currentUser).toBeNull();

    await expect(getPublicUserData).rejects.toThrow();
    await expect(getPrivateUserData).rejects.toThrow();
});

test("Setter functions throw errors when user is unauthenticated", async () => {
    expect(auth.currentUser).toBeNull();

    await expect(setPublicUserData({})).rejects.toThrow();
    await expect(setPrivateUserData({})).rejects.toThrow();
});
