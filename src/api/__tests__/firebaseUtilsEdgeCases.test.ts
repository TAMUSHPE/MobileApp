import { DocumentReference, collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import { getPrivateUserData, getPublicUserData, setCommitteeData, setPrivateUserData, setPublicUserData } from "../firebaseUtils";
import { User } from "../../types/user";

const testUserDataList: User[] = require("./test_data/users.json");

const clearSubcollections = async (docRef: DocumentReference) => {
    const subcollectionsSnapshot = await getDocs(collection(docRef, 'private'));
    const batch = writeBatch(db);

    subcollectionsSnapshot.forEach(subDoc => {
        batch.delete(subDoc.ref);
    });

    await batch.commit();
};

const clearCollection = async (collectionName: string) => {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);

    const batch = writeBatch(db);

    for (const documentSnapshot of querySnapshot.docs) {
        await clearSubcollections(documentSnapshot.ref);
        batch.delete(documentSnapshot.ref);
    }

    await batch.commit();
};


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

afterAll(async () => {
    clearCollection("users");
})

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
