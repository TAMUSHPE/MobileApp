import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { Committee } from "../../../types/committees";
import { checkCommitteeRequestStatus, deleteCommittee, getCommittee, getCommitteeMembers, getCommittees, getPublicUserData, removeCommitteeRequest, resetCommittee, setCommitteeData, submitCommitteeRequest } from "../../../api/firebaseUtils";
import { User } from "../../../types/user";

const testUserDataList: User[] = require("../../../api/__tests__/test_data/users.json");

const generateTestCommittee = async (overrides: Partial<Committee> = {}): Promise<Committee> => {
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

    const userDocRefTest = doc(db, "users", "TESTUSER1123");
    const userDocTest = await getDoc(userDocRefTest);

    if (!userDocTest.exists()) {
        await setDoc(userDocRefTest, { name: "fakename" });
    } else {
        await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
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
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }
        const committeeData = await generateTestCommittee({ head: "TESTUSER1123" });
        await setCommitteeData(committeeData);

        const committees = await getCommittees();
        expect(Array.isArray(committees)).toBe(true);
        if (committees.length > 0) {
            expect(committees[0]).toHaveProperty("firebaseDocName");
            expect(committees[0]).toHaveProperty("name");
        }
    });

    test("Get committees sorted by memberCount", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER4");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData1 = await generateTestCommittee({ firebaseDocName: "committee1", memberCount: 5, head: "TESTUSER4" });
        const committeeData2 = await generateTestCommittee({ firebaseDocName: "committee2", memberCount: 15, head: "TESTUSER4" });

        await setCommitteeData(committeeData1);
        await setCommitteeData(committeeData2);

        const committees = await getCommittees();
        expect(committees[0].memberCount).toBeGreaterThan(committees[1].memberCount!);
    });
});

describe("Set Committee Data", () => {
    test("with valid input", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData = await generateTestCommittee();
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with invalid head UID", async () => {
        const committeeData = await generateTestCommittee({ head: "invalidHeadUID" });

        await expect(setCommitteeData(committeeData)).rejects.toThrow("Bad Head UID");
    });

    test("with falsy firebaseDocName", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }
        const committeeData = await generateTestCommittee({ firebaseDocName: "" });

        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("Throws when not given a firebaseDocName", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData = await generateTestCommittee({ firebaseDocName: undefined });
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("with missing optional fields", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData = await generateTestCommittee({ color: undefined, logo: undefined });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with empty representatives and leads", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData = await generateTestCommittee({ representatives: [], leads: [] });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });
});

describe("Delete and Reset Committee", () => {
    test("Delete committee", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData = await generateTestCommittee();
        await setCommitteeData(committeeData);

        await deleteCommittee(committeeData.firebaseDocName!);
        const deletedCommittee = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        expect(deletedCommittee.exists()).toBe(false);
    });

    test("Reset committee", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

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
        const userDocRefTest = doc(db, "users", "TESTUSER5");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }
        const committeeData = await generateTestCommittee({ head: "TESTUSER5" });
        await setCommitteeData(committeeData);

        const userRef = doc(db, "users", "testUserForDeleteAndUpdateCommitteeList");
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, { committees: [committeeData.firebaseDocName], name: "fakename" });
        } else {
            await setDoc(userRef, { ...userDoc.data(), committees: [committeeData.firebaseDocName], name: "fakename" });
        }

        await deleteCommittee(committeeData.firebaseDocName!);

        // Add a delay to ensure Firestore consistency
        await new Promise(resolve => setTimeout(resolve, 500));

        const updatedUserDoc = await getDoc(userRef);
        const updatedUserData = updatedUserDoc.data();

        expect(updatedUserData).toBeDefined();
        expect(updatedUserData?.committees).not.toContain(committeeData.firebaseDocName);
    });

    test("Reset committee updates users' committee list", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }
        const committeeData = await generateTestCommittee({ head: "TESTUSER1123" });
        await setCommitteeData(committeeData);

        const userRef = doc(db, "users", "testUser");
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, { committees: [committeeData.firebaseDocName], name: "fakename" });
        } else {
            await setDoc(userRef, { ...userDoc.data(), committees: [committeeData.firebaseDocName] });
        }

        await resetCommittee(committeeData.firebaseDocName!);

        const updatedUserDoc = await getDoc(userRef);
        const updatedUserData = updatedUserDoc.data();

        // Verify the user document and committees field
        expect(updatedUserData).toBeDefined();
        expect(updatedUserData?.committees).not.toContain(committeeData.firebaseDocName);
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
    test("Can be deleted", async () => {
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData: Committee = {
            head: "TESTUSER1123",
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
        const userDocRefTest = doc(db, "users", "TESTUSER1123");
        const userDocTest = await getDoc(userDocRefTest);

        if (!userDocTest.exists()) {
            await setDoc(userDocRefTest, { name: "fakename" });
        } else {
            await setDoc(userDocRefTest, { ...userDocTest.data(), name: "fakename" });
        }

        const committeeData = await generateTestCommittee({ firebaseDocName: "RESETTINGCOMMITTEE", head: "TESTUSER1123" });

        const userDocRef = doc(db, "users", "1234");
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                uid: "1234",
                name: "Test User",
                email: `@test.com`,
                committees: ["RESETTINGCOMMITTEE"],
            });
        }
        // Set up initial committee data
        await setCommitteeData(committeeData);

        let committeeMemberInfo = await getPublicUserData("1234");
        expect(typeof committeeMemberInfo?.committees).toBe("object");
        expect(committeeMemberInfo?.committees!).toContain("RESETTINGCOMMITTEE");

        await resetCommittee(committeeData.firebaseDocName!);

        const obtainedCommitteeData = await getCommittee(committeeData.firebaseDocName!);
        expect(obtainedCommitteeData?.memberCount).toBe(0);

        committeeMemberInfo = await getPublicUserData("1234");
        expect(committeeMemberInfo?.committees!).not.toContain("RESETTINGCOMMITTEE");
    });

});
