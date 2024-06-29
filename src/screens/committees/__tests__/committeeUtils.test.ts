import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { DocumentReference, collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { Committee } from "../../../types/committees";
import { checkCommitteeRequestStatus, deleteCommittee, getCommittee, getCommitteeMembers, getCommittees, getPublicUserData, removeCommitteeRequest, resetCommittee, setCommitteeData, submitCommitteeRequest } from "../../../api/firebaseUtils";
import { User } from "../../../types/user";

const generateTestCommittee = async (overrides: Partial<Committee> = {}): Promise<Committee> => {
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

const generateTestUsers = async (overrides: Partial<User> = {}): Promise<User> => {
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

const createTestUserInFirebase = async (user: User) => {
    const publicInfo = user.publicInfo;
    const privateInfo = user.private?.privateInfo;

    await setDoc(doc(db, "users", publicInfo?.uid!), publicInfo);
    await setDoc(doc(db, `users/${publicInfo?.uid!}/private`, "privateInfo"), privateInfo);
};

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

    await clearCollection("users");
    await clearCollection("committees")
    await clearCollection("committeeVerification");
});

describe("Get Committees", () => {
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

        const testUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(testUser);
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
    });

    test("Get committees returns empty array if no data", async () => {
        const committees = await getCommittees();
        expect(committees).toEqual([]);
    });

    test("Get committees with data", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await setCommitteeData(committeeData);

        const committees = await getCommittees();
        expect(Array.isArray(committees)).toBe(true);
        expect(committees.length).toBeGreaterThan(0);

        if (committees.length > 0) {
            expect(committees[0]).toHaveProperty("firebaseDocName");
            expect(committees[0]).toHaveProperty("name");
        }
    });

    test("Get committees sorted by memberCount", async () => {
        const SAMPLEFIREBASEDOCNAME1 = "SampleFirebaseDocName1";
        const SAMPLEFIREBASEDOCNAME2 = "SampleFirebaseDocName2";
        const committeeData1 = await generateTestCommittee({ firebaseDocName: SAMPLEFIREBASEDOCNAME1, memberCount: 5, head: HEADUSER });
        const committeeData2 = await generateTestCommittee({ firebaseDocName: SAMPLEFIREBASEDOCNAME2, memberCount: 15, head: HEADUSER });

        await setCommitteeData(committeeData1);
        await setCommitteeData(committeeData2);

        const committees = await getCommittees();
        expect(committees[0].memberCount).toBeGreaterThan(committees[1].memberCount!);
    });
});

describe("Set Committee Data", () => {
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

        const testUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(testUser);
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
    });

    test("with valid input", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with invalid head UID", async () => {
        const committeeData = await generateTestCommittee({ head: "invalidHeadUID" });
        await expect(setCommitteeData(committeeData)).rejects.toThrow("Bad Head UID");
    });

    test("with falsy firebaseDocName", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, firebaseDocName: "" });
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("Throws when not given a firebaseDocName", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, firebaseDocName: undefined });
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("with missing optional fields", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, color: undefined, logo: undefined });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with empty representatives and leads", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, representatives: [], leads: [] });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });
});

describe("Delete and Reset Committee", () => {
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

        const testUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(testUser);
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
    });


    test("Delete committee", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await setCommitteeData(committeeData);

        await deleteCommittee(committeeData.firebaseDocName!);
        const deletedCommittee = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        expect(deletedCommittee.exists()).toBe(false);
    });

    test("Reset committee", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
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
        const TESTUSER1 = "TestUser1";
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await setCommitteeData(committeeData);

        const testUser = await generateTestUsers({ publicInfo: { committees: [committeeData.firebaseDocName!], uid: TESTUSER1 } });
        await createTestUserInFirebase(testUser);

        const userRef = doc(db, "users", TESTUSER1);
        const initialUserDoc = await getDoc(userRef);
        const initialUserData = initialUserDoc.data();
        expect(initialUserData).toBeDefined();
        expect(initialUserData?.committees).toContain(committeeData.firebaseDocName);

        await deleteCommittee(committeeData.firebaseDocName!);

        const updatedUserDoc = await getDoc(userRef);
        const updatedUserData = updatedUserDoc.data();

        expect(updatedUserData).toBeDefined();
        expect(updatedUserData?.committees).not.toContain(committeeData.firebaseDocName);
    });

    test("Reset committee updates users' committee list", async () => {
        const TESTUSER2 = "TestUser2";
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await setCommitteeData(committeeData);

        const testUser = await generateTestUsers({ publicInfo: { committees: [committeeData.firebaseDocName!], uid: TESTUSER2 } });
        await createTestUserInFirebase(testUser);

        const userRef = doc(db, "users", TESTUSER2);
        const initialUserDoc = await getDoc(userRef);
        const initialUserData = initialUserDoc.data();
        expect(initialUserData).toBeDefined();
        expect(initialUserData?.committees).toContain(committeeData.firebaseDocName);

        await resetCommittee(committeeData.firebaseDocName!);

        const updatedUserDoc = await getDoc(userRef);
        const updatedUserData = updatedUserDoc.data();

        expect(updatedUserData).toBeDefined();
        expect(updatedUserData?.committees).not.toContain(committeeData.firebaseDocName);
    });
});

describe('getCommitteeMembers', () => {
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

        const testUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(testUser);
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
    });


    test('returns committee members', async () => {
        const TESTUSER1 = "TestUser1";
        const TESTUSER2 = "TestUser2";
        const SAMPLEFIREBASEDOCNAME1 = "SampleFirebaseDocName1";
        const committeeData = await generateTestCommittee({ head: HEADUSER, firebaseDocName: SAMPLEFIREBASEDOCNAME1 });
        await setCommitteeData(committeeData);

        const testUser1 = await generateTestUsers({ publicInfo: { committees: [committeeData.firebaseDocName!], uid: TESTUSER1 } });
        const testUser2 = await generateTestUsers({ publicInfo: { committees: [], uid: TESTUSER2 } });

        await createTestUserInFirebase(testUser1);
        await createTestUserInFirebase(testUser2);

        const members = await getCommitteeMembers(committeeData.firebaseDocName!);

        expect(members).toHaveLength(1);
        expect(members[0].uid).toBe(TESTUSER1);
    });

    test('returns no members if no one is part of the committee', async () => {
        const TESTUSER3 = "TestUser3";
        const TESTUSER4 = "TestUser4";
        const SAMPLEFIREBASEDOCNAME2 = "SampleFirebaseDocName2";
        const committeeData = await generateTestCommittee({ head: HEADUSER, firebaseDocName: SAMPLEFIREBASEDOCNAME2 });
        await setCommitteeData(committeeData);

        const testUser3 = await generateTestUsers({ publicInfo: { committees: [], uid: TESTUSER3 } });
        const testUser4 = await generateTestUsers({ publicInfo: { committees: [], uid: TESTUSER4 } });

        await createTestUserInFirebase(testUser3);
        await createTestUserInFirebase(testUser4);

        const members = await getCommitteeMembers(committeeData.firebaseDocName!);

        expect(members).toHaveLength(0);
    });
});

describe('Committee Request', () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
        await clearCollection("committeeVerification");
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
        await clearCollection("committeeVerification");

        removeCommitteeRequest("SampleFirebaseDocName", "USER1");
    });


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
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

        const testUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(testUser);
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
    });

    test("Can be deleted", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await setCommitteeData(committeeData);

        expect(await getCommittee(committeeData.firebaseDocName!)).not.toBeNull();

        await deleteCommittee(committeeData.firebaseDocName!);

        expect(await getCommittee(committeeData.firebaseDocName!)).toBeNull();
    });


    test("Can be reset", async () => {
        const TESTUSER1 = "TestUser1";
        const SAMPLEFIREBASEDOCNAME = "SampleFirebaseDocName3";
        const committeeData = await generateTestCommittee({ firebaseDocName: SAMPLEFIREBASEDOCNAME, head: HEADUSER });
        await setCommitteeData(committeeData);

        const testUser = await generateTestUsers({ publicInfo: { committees: [committeeData.firebaseDocName!], uid: TESTUSER1 } });
        await createTestUserInFirebase(testUser);


        let committeeMemberInfo = await getPublicUserData(TESTUSER1);
        expect(committeeMemberInfo?.committees!).toContain(SAMPLEFIREBASEDOCNAME);

        await resetCommittee(committeeData.firebaseDocName!);

        const obtainedCommitteeData = await getCommittee(committeeData.firebaseDocName!);
        expect(obtainedCommitteeData?.memberCount).toBeGreaterThanOrEqual(0);

        committeeMemberInfo = await getPublicUserData(TESTUSER1);
        expect(committeeMemberInfo?.committees!).not.toContain(SAMPLEFIREBASEDOCNAME);
    });
});
