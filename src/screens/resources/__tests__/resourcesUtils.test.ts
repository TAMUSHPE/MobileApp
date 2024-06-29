import { deleteDoc, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { deleteUserResumeData, fetchLink, fetchUsersWithPublicResumes, getResumeVerificationStatus, getSortedUserData, removeResumeVerificationDoc, removeUserResume, updateLink, uploadResumeVerificationDoc } from "../../../api/firebaseUtils";
import { User } from "../../../types/user";
import { LinkData } from "../../../types/links";

const testUserDataList: User[] = require("../../../api/__tests__/test_data/users.json");


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

    // Create fake user data
    for (const user of testUserDataList) {
        await setDoc(doc(db, "users", user.publicInfo!.uid!), user.publicInfo);
        await setDoc(doc(db, `users/${user.publicInfo!.uid!}/private`, "privateInfo"), user.private?.privateInfo);
    }
});

afterAll(async () => {
    await signOut(auth);
});

describe("getSortedUserData", () => {
    test("filter by all time points", async () => {
        const amount = 5;
        const lastDoc = null;
        const filter = "allTime";

        const result = await getSortedUserData(amount, lastDoc, filter);

        expect(result.data).toBeDefined();
        expect(result.data.length).toBeLessThanOrEqual(amount);
        if (result.data.length > 0) {
            expect(result.data[0]).toHaveProperty('uid');
            expect(result.data[0]).toHaveProperty('points');
        }
        expect(result.lastVisible).toBeDefined();
    });

    test("filter by monthly points", async () => {
        const amount = 5;
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

    test("should handle no data gracefully", async () => {
        const userRef = collection(db, 'users');
        const querySnapshot = await getDocs(userRef);
        for (const userDoc of querySnapshot.docs) {
            await deleteDoc(doc(db, 'users', userDoc.id));
        }

        const amount = 5;
        const lastDoc = null;
        const filter = "allTime";

        const result = await getSortedUserData(amount, lastDoc, filter);

        expect(result.data).toBeDefined();
        expect(result.data.length).toBe(0);
        expect(result.lastVisible).toBeNull();
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

    test("getResumeVerificationStatus returns true for existing document", async () => {
        await setDoc(doc(db, `resumeVerification/${testUID}`), { resumePublicURL: testURL });

        const result = await getResumeVerificationStatus(testUID);
        expect(result).toBe(true);

        await deleteDoc(doc(db, 'resumeVerification', testUID));
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

        await deleteDoc(doc(db, 'resumeVerification', testUID));
        await deleteDoc(doc(db, 'users', testUID));
    });

    test("removeResumeVerificationDoc deletes the document", async () => {
        await setDoc(doc(db, `resumeVerification/${testUID}`), { resumePublicURL: testURL });

        await removeResumeVerificationDoc(testUID);

        const resumeDoc = await getDoc(doc(db, `resumeVerification/${testUID}`));
        expect(resumeDoc.exists()).toBe(false);

        await deleteDoc(doc(db, 'resumeVerification', testUID));
    });

    test("uploadResumeVerificationDoc sets the document correctly", async () => {
        await uploadResumeVerificationDoc(testUID, testURL);

        const resumeDoc = await getDoc(doc(db, `resumeVerification/${testUID}`));
        expect(resumeDoc.exists()).toBe(true);
        const resumeData = resumeDoc.data();
        expect(resumeData?.resumePublicURL).toBe(testURL);
        expect(resumeData?.uploadDate).toBeDefined();

        await deleteDoc(doc(db, 'resumeVerification', testUID));
    });
});

describe("fetchUsersWithPublicResumes", () => {
    const users = [
        { uid: "user1", resumeVerified: true, major: "CSCE", classYear: "2023" },
        { uid: "user2", resumeVerified: true, major: "MEEN", classYear: "2024" },
        { uid: "user3", resumeVerified: false, major: "CSCE", classYear: "2023" },
        { uid: "user4", resumeVerified: true, major: "CSCE", classYear: "2024" },
    ];

    beforeEach(async () => {
        // Create test user data
        for (const user of users) {
            await setDoc(doc(db, "users", user.uid), user);
        }
    });

    afterEach(async () => {
        // Clean up any remaining data
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        for (const userDoc of querySnapshot.docs) {
            await deleteDoc(doc(db, 'users', userDoc.id));
        }
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


describe("removeUserResume", () => {
    const uid = "testUID123";
    const userDocRef = doc(db, 'users', uid);


    test("removes resume fields from user document", async () => {
        await setDoc(userDocRef, { resumePublicURL: "resume.pdf", resumeVerified: true });
        await removeUserResume(uid);

        const userDoc = await getDoc(userDocRef);
        expect(userDoc.exists()).toBe(true);
        const userData = userDoc.data();
        expect(userData?.resumePublicURL).toBeUndefined();
        expect(userData?.resumeVerified).toBe(false);

        await deleteDoc(userDocRef);
    });
});