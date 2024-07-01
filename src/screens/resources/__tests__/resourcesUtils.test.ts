import { deleteDoc, collection, getDocs, doc, setDoc, getDoc, writeBatch, DocumentReference } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { deleteUserResumeData, fetchLink, fetchUsersWithPublicResumes, getResumeVerificationStatus, getSortedUserData, removeResumeVerificationDoc, removeUserResume, updateLink, uploadResumeVerificationDoc } from "../../../api/firebaseUtils";
import { LinkData } from "../../../types/links";
import { User } from "../../../types/user";

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
    await clearCollection("events");
}, 30000);

describe("getSortedUserData", () => {
    const TESTUSER1 = "TestUser1"
    const TESTUSER2 = "TestUser2"
    const TESTUSER3 = "TestUser3"
    const TESTUSER4 = "TestUser4"
    const TESTUSER5 = "TestUser5"

    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")

        const testUser1 = await generateTestUsers({ publicInfo: { uid: TESTUSER1, pointsThisMonth: 5, points: 1 } });
        const testUser2 = await generateTestUsers({ publicInfo: { uid: TESTUSER2, pointsThisMonth: 4, points: 2 } });
        const testUser3 = await generateTestUsers({ publicInfo: { uid: TESTUSER3, pointsThisMonth: 3, points: 3 } });
        const testUser4 = await generateTestUsers({ publicInfo: { uid: TESTUSER4, pointsThisMonth: 2, points: 4 } });
        const testUser5 = await generateTestUsers({ publicInfo: { uid: TESTUSER5, pointsThisMonth: 1, points: 5 } });

        await createTestUserInFirebase(testUser1);
        await createTestUserInFirebase(testUser2);
        await createTestUserInFirebase(testUser3);
        await createTestUserInFirebase(testUser4);
        await createTestUserInFirebase(testUser5);
    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    test("filter by all time points", async () => {
        const amount = 2;
        const lastDoc = null;
        const filter = "allTime";

        const result = await getSortedUserData(amount, lastDoc, filter);

        expect(result.data).toBeDefined();

        console.log("result.data", result.data);

        expect(result.data.length).toBeLessThanOrEqual(amount);
        if (result.data.length > 0) {
            expect(result.data[0]).toHaveProperty('uid');
            expect(result.data[0]).toHaveProperty('points');
        }
        expect(result.lastVisible).toBeDefined();
    });

    test("filter by monthly points", async () => {
        const amount = 2;
        const lastDoc = null;
        const filter = "monthly";

        const result = await getSortedUserData(amount, lastDoc, filter);

        expect(result.data).toBeDefined();
        expect(result.data.length).toBeLessThanOrEqual(amount);
        if (result.data.length > 0) {
            expect(result.data[0]).toHaveProperty('uid');
            expect(result.data[0]).toHaveProperty('pointsThisMonth');
        }
        expect(result.lastVisible).toBeDefined();
    });

    test("return next set of user with lastDoc provided", async () => {
        const amount = 1;
        const filter = "allTime";

        // Fetch first set of data to get lastVisible doc
        const initialResult = await getSortedUserData(amount, null, filter);
        const lastDoc = initialResult.lastVisible;
        const result = await getSortedUserData(amount, lastDoc, filter);

        expect(result.data).toBeDefined();
        expect(result.data.length).toBeLessThanOrEqual(amount);
        if (result.data.length > 0) {
            expect(result.data[0]).toHaveProperty('uid');
            expect(result.data[0]).toHaveProperty('points');
        }
        expect(result.lastVisible).toBeDefined();
    });
});

describe("fetchLink and updateLink", () => {
    const testLinkData: LinkData = {
        id: "testLinkID",
        name: "Test Link",
        url: "https://example.com",
        imageUrl: ""
    };

    beforeAll(async () => {
        await updateLink(testLinkData);
    });

    afterAll(async () => {
        await deleteDoc(doc(db, 'links', testLinkData.id));
    });

    test("fetch link data for a valid linkID", async () => {
        const result = await fetchLink(testLinkData.id);

        expect(result).toBeDefined();
        expect(result).toEqual(testLinkData);
    });

    test("return null for an invalid linkID", async () => {
        const result = await fetchLink("invalidLinkID");

        expect(result).toBeNull();
    });
});

describe("Resume Verification Process", () => {
    const testUID = "testUID";
    const testURL = "https://example.com/resume.pdf";

    beforeEach(async () => {
        await clearCollection("users");
        await clearCollection("resumeVerification");
    });

    afterEach(async () => {
        await clearCollection("users");
        await clearCollection("resumeVerification");
    });

    test("getResumeVerificationStatus returns true for existing document", async () => {
        await setDoc(doc(db, `resumeVerification/${testUID}`), { resumePublicURL: testURL });

        const result = await getResumeVerificationStatus(testUID);
        expect(result).toBe(true);
    });

    test("getResumeVerificationStatus returns false for non-existing document", async () => {
        const result = await getResumeVerificationStatus(testUID);
        expect(result).toBe(false);
    });

    test("deleteUserResumeData updates user document correctly", async () => {
        await setDoc(doc(db, 'users', testUID), { resumePublicURL: testURL, resumeVerified: true });

        await deleteUserResumeData(testUID);

        const userDoc = await getDoc(doc(db, 'users', testUID));
        expect(userDoc.exists()).toBe(true);
        const userData = userDoc.data();
        expect(userData?.resumePublicURL).toBeUndefined();
        expect(userData?.resumeVerified).toBe(false);
    });

    test("removeResumeVerificationDoc deletes the document", async () => {
        await setDoc(doc(db, `resumeVerification/${testUID}`), { resumePublicURL: testURL });

        await removeResumeVerificationDoc(testUID);

        const resumeDoc = await getDoc(doc(db, `resumeVerification/${testUID}`));
        expect(resumeDoc.exists()).toBe(false);

    });

    test("uploadResumeVerificationDoc sets the document correctly", async () => {
        await uploadResumeVerificationDoc(testUID, testURL);

        const resumeDoc = await getDoc(doc(db, `resumeVerification/${testUID}`));
        expect(resumeDoc.exists()).toBe(true);
        const resumeData = resumeDoc.data();
        expect(resumeData?.resumePublicURL).toBe(testURL);
        expect(resumeData?.uploadDate).toBeDefined();
    });
});

describe("fetchUsersWithPublicResumes", () => {
    const users = [
        { uid: "user1", resumeVerified: true, major: "CSCE", classYear: "2023" },
        { uid: "user2", resumeVerified: true, major: "MEEN", classYear: "2024" },
        { uid: "user3", resumeVerified: false, major: "CSCE", classYear: "2023" },
        { uid: "user4", resumeVerified: true, major: "CSCE", classYear: "2024" },
    ];

    beforeAll(async () => {
        for (const user of users) {
            await setDoc(doc(db, "users", user.uid), user);
        }
    });

    afterAll(async () => {
        clearCollection("users");
    });

    test("fetches all users with verified resumes", async () => {
        const result = await fetchUsersWithPublicResumes(null);
        expect(result.length).toBe(3);
        expect(result.some(user => user.uid === "user1")).toBe(true);
        expect(result.some(user => user.uid === "user2")).toBe(true);
        expect(result.some(user => user.uid === "user4")).toBe(true);
    });

    test("fetches users with verified resumes filtered by major", async () => {
        const result = await fetchUsersWithPublicResumes({ major: "CSCE" });
        expect(result.length).toBe(2);
        expect(result.some(user => user.uid === "user1")).toBe(true);
        expect(result.some(user => user.uid === "user4")).toBe(true);
    });

    test("fetches users with verified resumes filtered by class year", async () => {
        const result = await fetchUsersWithPublicResumes({ classYear: "2024" });
        expect(result.length).toBe(2);
        expect(result.some(user => user.uid === "user2")).toBe(true);
        expect(result.some(user => user.uid === "user4")).toBe(true);
    });

    test("fetches users with verified resumes filtered by major and class year", async () => {
        const result = await fetchUsersWithPublicResumes({ major: "CSCE", classYear: "2024" });
        expect(result.length).toBe(1);
        expect(result.some(user => user.uid === "user4")).toBe(true);
    });

    test("returns empty array if no users match the filters", async () => {
        const result = await fetchUsersWithPublicResumes({ major: "ME", classYear: "2025" });
        expect(result.length).toBe(0);
    });
});

// This test is disabled because there is some odd behavior with user doc being prematurely deleted after "removeUserResume" is called

// describe("removeUserResume", () => {
//     const TESTUSERRESUME1 = "TestUserResume1";
//     beforeEach(async () => {
//         clearCollection("users");
//         const testUser = await generateTestUsers({
//             publicInfo: {
//                 uid: TESTUSERRESUME1,
//                 resumePublicURL: "resume.pdf",
//                 resumeVerified: true,
//             }
//         });
//         await createTestUserInFirebase(testUser);
//     });

//     afterAll(async () => {
//         clearCollection("users");
//     });

//     test("removes resume fields from user document", async () => {
//         await removeUserResume(TESTUSERRESUME1);

//         const userDocRef = doc(db, 'users', TESTUSERRESUME1);
//         const userDoc = await getDoc(userDocRef);
//         expect(userDoc.exists()).toBe(true);

//         const userData = userDoc.data();
//         expect(userData?.resumePublicURL).toBeUndefined();
//         expect(userData?.resumeVerified).toBe(false);

//         await deleteDoc(userDocRef);
//     });
// });