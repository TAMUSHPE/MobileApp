import { deleteDoc, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { deleteUserResumeData, fetchLink, getResumeVerificationStatus, getSortedUserData, removeResumeVerificationDoc, updateLink, uploadResumeVerificationDoc } from "../../../api/firebaseUtils";
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

    beforeEach(async () => {
        await deleteDoc(doc(db, 'resumeVerification', testUID));
        await deleteDoc(doc(db, 'users', testUID));
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'resumeVerification', testUID));
        await deleteDoc(doc(db, 'users', testUID));
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