import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { Committee } from "../../../types/committees";
import { checkCommitteeRequestStatus, deleteCommittee, getCommittee, getCommitteeMembers, getCommittees, getPublicUserData, removeCommitteeRequest, resetCommittee, setCommitteeData, submitCommitteeRequest } from "../../../api/firebaseUtils";
import { User } from "../../../types/user";

const testUserDataList: User[] = require("../../../api/__tests__/test_data/users.json");

const generateTestUser = async (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            uid,
            name: "Test User",
            email: `${uid}@test.com`,
            roles: {
                admin: false,
                developer: false,
                lead: false,
                officer: false,
                reader: true,
                representative: false,
            }
        });
    }
};

const generateTestCommittee = async (overrides: Partial<Committee> = {}): Promise<Committee> => {
    await generateTestUser("TESTUSER1123");

    return {
        firebaseDocName: "test-committee",
        name: "Test Committee",
        color: "#500000",
        description: "This is a test committee",
        head: "TESTUSER1123",
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

    const committeesRef = collection(db, "committees");
    const committeesSnapshot = await getDocs(committeesRef);
    for (const doc of committeesSnapshot.docs) {
        await deleteDoc(doc.ref);
    }

    const userRef = collection(db, 'users');
    const querySnapshot = await getDocs(userRef);
    for (const userDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, 'users', userDoc.id));
    }

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
        const committeeData = await generateTestCommittee();
        await setCommitteeData(committeeData);

        const committees = await getCommittees();
        expect(Array.isArray(committees)).toBe(true);
        if (committees.length > 0) {
            expect(committees[0]).toHaveProperty("firebaseDocName");
            expect(committees[0]).toHaveProperty("name");
        }
    });

    test("Get committees sorted by memberCount", async () => {
        const committeeData1 = await generateTestCommittee({ firebaseDocName: "committee1", memberCount: 5 });
        const committeeData2 = await generateTestCommittee({ firebaseDocName: "committee2", memberCount: 15 });
        await setCommitteeData(committeeData1);
        await setCommitteeData(committeeData2);

        const committees = await getCommittees();
        expect(committees[0].memberCount).toBeGreaterThan(committees[1].memberCount!);
    });
});

describe("Set Committee Data", () => {
    test("with valid input", async () => {
        const committeeData = await generateTestCommittee();
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with invalid head UID", async () => {
        const committeeData = await generateTestCommittee({ head: "invalidHeadUID" });

        await expect(setCommitteeData(committeeData)).rejects.toThrow("Bad Head UID");
    });

    test("with falsy firebaseDocName", async () => {
        const committeeData = await generateTestCommittee({ firebaseDocName: "" });

        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("Throws when not given a firebaseDocName", async () => {
        const committeeData = await generateTestCommittee({ firebaseDocName: undefined, head: "TESTUSER1" });
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("with missing optional fields", async () => {
        const committeeData = await generateTestCommittee({ color: undefined, logo: undefined });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with empty representatives and leads", async () => {
        const committeeData = await generateTestCommittee({ representatives: [], leads: [] });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });
});

describe("Delete and Reset Committee", () => {
    test("Delete committee", async () => {
        const committeeData = await generateTestCommittee();
        await setCommitteeData(committeeData);

        await deleteCommittee(committeeData.firebaseDocName!);
        const deletedCommittee = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        expect(deletedCommittee.exists()).toBe(false);
    });

    test("Reset committee", async () => {
        const committeeData = await generateTestCommittee();
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
        const committeeData = await generateTestCommittee();
        await setCommitteeData(committeeData);

        const userRef = doc(db, "users", "testUser");
        await setDoc(userRef, { committees: [committeeData.firebaseDocName] });

        await deleteCommittee(committeeData.firebaseDocName!);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        expect(userData?.committees).not.toContain(committeeData.firebaseDocName);
    });

    test("Reset committee updates users' committee list", async () => {
        const committeeData = await generateTestCommittee();
        await setCommitteeData(committeeData);

        const userRef = doc(db, "users", "testUser");
        await setDoc(userRef, { committees: [committeeData.firebaseDocName] });

        await resetCommittee(committeeData.firebaseDocName!);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        expect(userData?.committees).not.toContain(committeeData.firebaseDocName);
    });
});

describe('getCommitteeMembers', () => {
    test('returns committee members', async () => {
        const userRef1 = doc(db, `users/USER1`);
        const userRef2 = doc(db, `users/USER2`);

        await setDoc(userRef1, { committees: ["SampleFirebaseDocName"] });
        await setDoc(userRef2, { committees: [] });

        const members = await getCommitteeMembers("SampleFirebaseDocName");

        expect(members).toHaveLength(1);
        expect(members[0].uid).toBe("USER1");
    });

    test('returns no members if no one is part of the committee', async () => {
        const userRef1 = doc(db, `users/USER1`);
        const userRef2 = doc(db, `users/USER2`);

        await setDoc(userRef1, { committees: [] });
        await setDoc(userRef2, { committees: [] });

        const members = await getCommitteeMembers("SampleFirebaseDocName");

        expect(members).toHaveLength(0);
    });
});

describe('Committee Request', () => {
    test('creates a committee request', async () => {
        await submitCommitteeRequest("SampleFirebaseDocName", "USER1");

        const requestRef = doc(db, `committeeVerification/SampleFirebaseDocName/requests/USER1`);
        const requestSnapshot = await getDoc(requestRef);
        expect(requestSnapshot.exists()).toBe(true);
    });

    test('deletes a committee request', async () => {
        const requestRef = doc(db, `committeeVerification/SampleFirebaseDocName/requests/USER1`);
        await setDoc(requestRef, {});

        await removeCommitteeRequest("SampleFirebaseDocName", "USER1");

        const requestSnapshot = await getDoc(requestRef);
        expect(requestSnapshot.exists()).toBe(false);
    });

    test('returns true if the request exists', async () => {
        const requestRef = doc(db, `committeeVerification/SampleFirebaseDocName/requests/USER1`);
        await setDoc(requestRef, {});

        const result = await checkCommitteeRequestStatus("SampleFirebaseDocName", "USER1");
        expect(result).toBe(true);
    });

    test('returns false if the request does not exist', async () => {
        const result = await checkCommitteeRequestStatus("NonExistingFirebaseDocName", "USER1");
        expect(result).toBe(false);
    });
});

describe("Committee Info", () => {
    test("Can be created and queried", async () => {
        const committeeData: Committee = {
            name: "Test Committee",
            color: "#FF0000",
            description: "Test Description",
            head: "TESTUSER1",
            firebaseDocName: "QUERYINGCOMMITTEE",
        };

        expect(await setCommitteeData(committeeData)).toBe(true);

        const obtainedCommitteeData = await getCommittee(committeeData.firebaseDocName!);
        expect(obtainedCommitteeData).toMatchObject(committeeData);
    });

    test("Can be deleted", async () => {
        const committeeData: Committee = {
            head: "TESTUSER1",
            firebaseDocName: "DELETINGCOMMITTEE",
            name: "Bad Committee",
            applicationLink: "https://www.test.asdf/notreal",
        };

        await setCommitteeData(committeeData);
        expect(await getCommittee(committeeData.firebaseDocName!)).not.toBeNull();

        await deleteCommittee(committeeData.firebaseDocName!);
        expect(await getCommittee(committeeData.firebaseDocName!)).toBeNull();
    });

    test("Can be reset", async () => {
        const committeeData: Committee = {
            head: "TESTUSER2",
            firebaseDocName: "RESETTINGCOMMITTEE",
            name: "Resetting Committee",
            memberCount: 2,
        };

        let committeeMemberInfo = await getPublicUserData("TESTUSER1");
        expect(typeof committeeMemberInfo?.committees).toBe("object");
        expect(committeeMemberInfo?.committees!).toContain("QUERYINGCOMMITTEE");
        expect(committeeMemberInfo?.committees!).toContain(committeeData.firebaseDocName);

        await setCommitteeData(committeeData);
        await resetCommittee(committeeData.firebaseDocName!);

        const obtainedCommitteeData = await getCommittee(committeeData.firebaseDocName!);
        expect(obtainedCommitteeData?.memberCount).toBe(0);

        committeeMemberInfo = await getPublicUserData("TESTUSER1");
        expect(typeof committeeMemberInfo?.committees).toBe("object");
        expect(committeeMemberInfo?.committees!).toContain("QUERYINGCOMMITTEE");
        expect(committeeMemberInfo?.committees!).not.toContain(committeeData.firebaseDocName);
    });
});
