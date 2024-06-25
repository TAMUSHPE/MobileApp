import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { Committee } from "../../../types/committees";
import { deleteCommittee, getCommittees, resetCommittee, setCommitteeData } from "../../../api/firebaseUtils";
import { User } from "../../../types/user";

const testUserDataList: User[] = require("../../../api/__tests__/test_data/users.json");

const generateTestCommittee = (overrides: Partial<Committee> = {}): Committee => {
    return {
        firebaseDocName: "test-committee",
        name: "Test Committee",
        color: "#500000",
        description: "This is a test committee",
        head: "TESTUSER1",
        representatives: ["rep1UID", "rep2UID"],
        leads: ["lead1UID"],
        applicationLink: "http://testlink.com",
        logo: "default",
        memberCount: 10,
        isOpen: true,
        ...overrides
    };
};

beforeAll(async () => {
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

    // Clear events collection
    const committeesRef = collection(db, "committees");
    const committeesSnapshot = await getDocs(committeesRef);
    for (const doc of committeesSnapshot.docs) {
        await deleteDoc(doc.ref);
    }

    // Clean up any existing data
    const userRef = collection(db, 'users');
    const querySnapshot = await getDocs(userRef);
    for (const userDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, 'users', userDoc.id));
    }
    // Create fake user data
    for (const user of testUserDataList) {
        await setDoc(doc(db, "users", user.publicInfo!.uid!), user.publicInfo);
        await setDoc(doc(db, `users/${user.publicInfo!.uid!}/private`, "privateInfo"), user.private?.privateInfo);
    }
});

afterAll(async () => {
    await signOut(auth);
});

describe("Get Committees", () => {
    test("Get committees returns empty array if no data", async () => {
        const committees = await getCommittees();
        expect(committees).toEqual([]);
    });


    test("Get committees with data", async () => {
        const committeeData = generateTestCommittee();
        await setCommitteeData(committeeData);

        const committees = await getCommittees();
        expect(Array.isArray(committees)).toBe(true);
        if (committees.length > 0) {
            expect(committees[0]).toHaveProperty("firebaseDocName");
            expect(committees[0]).toHaveProperty("name");
        }
    });

    test("Get committees sorted by memberCount", async () => {
        const committeeData1 = generateTestCommittee({ firebaseDocName: "committee1", memberCount: 5 });
        const committeeData2 = generateTestCommittee({ firebaseDocName: "committee2", memberCount: 15 });
        await setCommitteeData(committeeData1);
        await setCommitteeData(committeeData2);

        const committees = await getCommittees();
        expect(committees[0].memberCount).toBeGreaterThan(committees[1].memberCount!);
    });
});

describe("Set Committee Data", () => {
    test("with valid input", async () => {
        const committeeData = generateTestCommittee();
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with invalid head UID", async () => {
        const committeeData = generateTestCommittee({ head: "invalidHeadUID" });

        await expect(setCommitteeData(committeeData)).rejects.toThrow("Bad Head UID");
    });

    test("with falsy firebaseDocName", async () => {
        const committeeData = generateTestCommittee({ firebaseDocName: "" });

        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("Throws when not given a firebaseDocName", async () => {
        const committeeData = generateTestCommittee({ firebaseDocName: undefined, head: "TESTUSER1" });
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("with missing optional fields", async () => {
        const committeeData = generateTestCommittee({ color: undefined, logo: undefined });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with empty representatives and leads", async () => {
        const committeeData = generateTestCommittee({ representatives: [], leads: [] });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });
});

describe("Delete and Reset Committee", () => {
    test("Delete committee", async () => {
        const committeeData = generateTestCommittee();
        await setCommitteeData(committeeData);

        await deleteCommittee(committeeData.firebaseDocName!);
        const deletedCommittee = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        expect(deletedCommittee.exists()).toBe(false);
    });

    test("Reset committee", async () => {
        const committeeData = generateTestCommittee();
        await setCommitteeData(committeeData);

        await resetCommittee(committeeData.firebaseDocName!);
        const resetCommitteeData = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        const data = resetCommitteeData.data();

        expect(data?.memberCount).toBe(0);
        expect(data?.applicationLink).toBe('');
        expect(data?.head).toBeUndefined();
        expect(data?.leads).toEqual([]);
        expect(data?.representatives).toEqual([]);
    });

    test("Delete committee updates users' committee list", async () => {
        const committeeData = generateTestCommittee();
        await setCommitteeData(committeeData);

        const userRef = doc(db, "users", "testUser");
        await setDoc(userRef, { committees: [committeeData.firebaseDocName] });

        await deleteCommittee(committeeData.firebaseDocName!);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        expect(userData?.committees).not.toContain(committeeData.firebaseDocName);
    });

    test("Reset committee updates users' committee list", async () => {
        const committeeData = generateTestCommittee();
        await setCommitteeData(committeeData);

        const userRef = doc(db, "users", "testUser");
        await setDoc(userRef, { committees: [committeeData.firebaseDocName] });

        await resetCommittee(committeeData.firebaseDocName!);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        expect(userData?.committees).not.toContain(committeeData.firebaseDocName);
    });
});