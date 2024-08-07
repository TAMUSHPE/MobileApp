import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { DocumentReference, Timestamp, collection, doc, getDoc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { FilterRole, PublicUserInfo, User } from "../../../types/user";
import { fetchOfficeCount, fetchOfficerStatus, getMOTM, getUserForMemberList, setMOTM, updateOfficerStatus } from "../../../api/firebaseUtils";
import { clearCollection, createTestUserInFirebase, generateTestUsers, waitForUser } from "../../../helpers/unitTestUtils";

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

    await clearCollection("users");
    await clearCollection("committees")
    await clearCollection("events")
    await clearCollection("office-hours")
    await clearCollection("member-of-the-month")
});

afterAll(async () => {
    await signOut(auth);

    await clearCollection("users");
    await clearCollection("committees")
    await clearCollection("events")
    await clearCollection("office-hours")
    await clearCollection("member-of-the-month")
});


describe("fetchOfficeCount", () => {
    beforeAll(async () => {
        await clearCollection("office-hours");

        const officeHoursCollection = collection(db, "office-hours");
        await setDoc(doc(officeHoursCollection, "officer1"), { signedIn: true });
        await setDoc(doc(officeHoursCollection, "officer2"), { signedIn: true });
        await setDoc(doc(officeHoursCollection, "officer3"), { signedIn: false });
    });

    test("returns correct count of signed in officers", async () => {
        const count = await fetchOfficeCount();
        expect(count).toBe(2);
    });
});

describe("fetchOfficerStatus", () => {
    const OFFICER_UID = "officer1";

    beforeAll(async () => {
        await clearCollection("office-hours");

        const officerStatusRef = doc(db, `office-hours/${OFFICER_UID}`);
        await setDoc(officerStatusRef, { signedIn: true });
    });

    test("returns officer status if officer is signed in", async () => {
        const status = await fetchOfficerStatus(OFFICER_UID);
        expect(status).toEqual({ signedIn: true });
    });

    test("returns null if officer status does not exist", async () => {
        const status = await fetchOfficerStatus("nonexistentUID");
        expect(status).toBeNull();
    });
});

describe("updateOfficerStatus", () => {
    const OFFICER_UID = "officer1";

    beforeAll(async () => {
        await clearCollection("office-hours");
    });

    test("updates officer status to signed in", async () => {
        await updateOfficerStatus(OFFICER_UID, true);

        const officerStatusRef = doc(db, `office-hours/${OFFICER_UID}`);
        const docSnap = await getDoc(officerStatusRef);

        expect(docSnap.exists()).toBe(true);
        const data = docSnap.data();
        expect(data?.signedIn).toBe(true);
        expect(data?.timestamp).toBeInstanceOf(Timestamp);
    });

    test("updates officer status to signed out", async () => {
        await updateOfficerStatus(OFFICER_UID, false);

        const officerStatusRef = doc(db, `office-hours/${OFFICER_UID}`);
        const docSnap = await getDoc(officerStatusRef);

        expect(docSnap.exists()).toBe(true);
        const data = docSnap.data();
        expect(data?.signedIn).toBe(false);
        expect(data?.timestamp).toBeInstanceOf(Timestamp);
    });
});

describe("getUserForMemberList", () => {
    const OFFICER_USER_UID = "officerUser";
    const REP_USER_UID = "repUser";
    const LEAD_USER_UID = "leadUser";
    const NON_ROLE_USER_UID = "nonRoleUser";

    beforeAll(async () => {
        await clearCollection("users");
    })

    beforeEach(async () => {
        // Create test users
        const officerUser = await generateTestUsers({ publicInfo: { uid: OFFICER_USER_UID, name: "Officer User", roles: { officer: true, representative: false, lead: false } } });
        const repUser = await generateTestUsers({ publicInfo: { uid: REP_USER_UID, name: "Rep User", roles: { officer: false, representative: true, lead: false } } });
        const leadUser = await generateTestUsers({ publicInfo: { uid: LEAD_USER_UID, name: "Lead User", roles: { officer: false, representative: false, lead: true } } });
        const nonRoleUser = await generateTestUsers({ publicInfo: { uid: NON_ROLE_USER_UID, name: "Non Role User", roles: { officer: false, representative: false, lead: false } } });

        await createTestUserInFirebase(officerUser);
        await createTestUserInFirebase(repUser);
        await createTestUserInFirebase(leadUser);
        await createTestUserInFirebase(nonRoleUser);
        await waitForUser(OFFICER_USER_UID, 30, 500, officerUser.publicInfo);
        await waitForUser(REP_USER_UID, 30, 500, repUser.publicInfo);
        await waitForUser(LEAD_USER_UID, 30, 500, leadUser.publicInfo);
        await waitForUser(NON_ROLE_USER_UID, 30, 500, nonRoleUser.publicInfo);
    }, 30000);

    afterAll(async () => {
        await clearCollection("users");
    })

    // test("returns members with officer role", async () => {
    //     // Create test users
    //     const officerUser = await generateTestUsers({ publicInfo: { uid: OFFICER_USER_UID, name: "Officer User", roles: { officer: true, representative: false, lead: false } } });
    //     const repUser = await generateTestUsers({ publicInfo: { uid: REP_USER_UID, name: "Rep User", roles: { officer: false, representative: true, lead: false } } });
    //     const leadUser = await generateTestUsers({ publicInfo: { uid: LEAD_USER_UID, name: "Lead User", roles: { officer: false, representative: false, lead: true } } });
    //     const nonRoleUser = await generateTestUsers({ publicInfo: { uid: NON_ROLE_USER_UID, name: "Non Role User", roles: { officer: false, representative: false, lead: false } } });

    //     await createTestUserInFirebase(officerUser);
    //     await createTestUserInFirebase(repUser);
    //     await createTestUserInFirebase(leadUser);
    //     await createTestUserInFirebase(nonRoleUser);
    //     await waitForUser(OFFICER_USER_UID, 30, 500, officerUser.publicInfo);
    //     await waitForUser(REP_USER_UID, 30, 500, repUser.publicInfo);
    //     await waitForUser(LEAD_USER_UID, 30, 500, leadUser.publicInfo);
    //     await waitForUser(NON_ROLE_USER_UID, 30, 500, nonRoleUser.publicInfo);

    //     const result = await getUserForMemberList(10, null, FilterRole.OFFICER);
    //     const members = result.members as PublicUserInfo[];
    //     expect(Array.isArray(members)).toBe(true);
    //     expect(members.length).toBe(1);
    //     expect(members[0].uid).toBe(OFFICER_USER_UID);
    //     expect(members[0].roles?.officer).toBe(true);
    // }, 30000);

    // test("returns members with representative role", async () => {
    //     // Create test users
    //     const officerUser = await generateTestUsers({ publicInfo: { uid: OFFICER_USER_UID, name: "Officer User", roles: { officer: true, representative: false, lead: false } } });
    //     const repUser = await generateTestUsers({ publicInfo: { uid: REP_USER_UID, name: "Rep User", roles: { officer: false, representative: true, lead: false } } });
    //     const leadUser = await generateTestUsers({ publicInfo: { uid: LEAD_USER_UID, name: "Lead User", roles: { officer: false, representative: false, lead: true } } });
    //     const nonRoleUser = await generateTestUsers({ publicInfo: { uid: NON_ROLE_USER_UID, name: "Non Role User", roles: { officer: false, representative: false, lead: false } } });

    //     await createTestUserInFirebase(officerUser);
    //     await createTestUserInFirebase(repUser);
    //     await createTestUserInFirebase(leadUser);
    //     await createTestUserInFirebase(nonRoleUser);
    //     await waitForUser(OFFICER_USER_UID, 30, 500, officerUser.publicInfo);
    //     await waitForUser(REP_USER_UID, 30, 500, repUser.publicInfo);
    //     await waitForUser(LEAD_USER_UID, 30, 500, leadUser.publicInfo);
    //     await waitForUser(NON_ROLE_USER_UID, 30, 500, nonRoleUser.publicInfo);

    //     const result = await getUserForMemberList(10, null, FilterRole.REPRESENTATIVE);
    //     const members = result.members as PublicUserInfo[];
    //     expect(Array.isArray(members)).toBe(true);
    //     expect(members.length).toBe(1);
    //     expect(members[0].uid).toBe(REP_USER_UID);
    //     expect(members[0].roles?.representative).toBe(true);
    // }, 30000);

    test("returns members with lead role", async () => {
        const result = await getUserForMemberList(10, null, FilterRole.LEAD);
        const members = result.members as PublicUserInfo[];
        expect(Array.isArray(members)).toBe(true);
        expect(members.length).toBe(1);
        expect(members[0].uid).toBe(LEAD_USER_UID);
        expect(members[0].roles?.lead).toBe(true);
    }, 30000);

    // test("returns members with no specific role filter", async () => {
    //     const result = await getUserForMemberList(10, null, null);
    //     const members = result.members as PublicUserInfo[];
    //     expect(Array.isArray(members)).toBe(true);
    //     expect(members.length).toBe(4); // All users should be returned
    // }, 30000);

    test("limits the number of members returned", async () => {
        const result = await getUserForMemberList(2, null, null);
        const members = result.members as PublicUserInfo[];
        expect(Array.isArray(members)).toBe(true);
        expect(members.length).toBe(2); // Should limit to 2 members
    }, 30000);

    // test("handles pagination with startAfterDoc", async () => {
    //     const firstBatch = await getUserForMemberList(2, null, null);
    //     const firstMembers = firstBatch.members as PublicUserInfo[];
    //     expect(firstMembers.length).toBe(2);

    //     const secondBatch = await getUserForMemberList(2, firstBatch.lastVisibleDoc, null);
    //     const secondMembers = secondBatch.members as PublicUserInfo[];
    //     expect(secondMembers.length).toBe(2);
    // }, 30000);

    test("handles pagination with officer role filter", async () => {
        // Create test users
        const officerUser = await generateTestUsers({ publicInfo: { uid: OFFICER_USER_UID, name: "Officer User", roles: { officer: true, representative: false, lead: false } } });
        await createTestUserInFirebase(officerUser);
        await waitForUser(OFFICER_USER_UID, 25, 500, officerUser.publicInfo);



        const firstBatch = await getUserForMemberList(1, null, FilterRole.OFFICER);
        const firstMembers = firstBatch.members as PublicUserInfo[];
        expect(firstMembers.length).toBe(1);

        const secondBatch = await getUserForMemberList(1, firstBatch.lastVisibleDoc, FilterRole.OFFICER);
        const secondMembers = secondBatch.members as PublicUserInfo[];
        expect(secondMembers.length).toBe(0);
    }, 30000);
});

describe("setMOTM and getMOTM", () => {
    const MEMBER_UID = "member1";
    const MEMBER_UID_2 = "member2";
    const testMember = {
        uid: MEMBER_UID,
        name: "Member One",
    } as PublicUserInfo;

    const testMember2 = {
        uid: MEMBER_UID_2,
        name: "Member Two",
    } as PublicUserInfo;

    beforeAll(async () => {
        await clearCollection("member-of-the-month");
    });

    afterAll(async () => {
        await clearCollection("member-of-the-month");
    });

    test("should set the member of the month successfully", async () => {
        const result = await setMOTM(testMember);
        expect(result).toBe(true);

        const motmDoc = await getDoc(doc(db, `member-of-the-month/member`));
        expect(motmDoc.exists()).toBe(true);
        expect(motmDoc.data()).toEqual({ member: testMember });

        const pastMembersDoc = await getDoc(doc(db, "member-of-the-month", "past-members"));
        expect(pastMembersDoc.exists()).toBe(true);
        expect(pastMembersDoc.data()?.members).toContain(MEMBER_UID);
    });

    test("should get the member of the month successfully", async () => {
        await setMOTM(testMember);

        const motm = await getMOTM();
        expect(motm).toEqual(testMember);
    });

    test("should return undefined if there is no member of the month", async () => {
        await clearCollection("member-of-the-month");

        const motm = await getMOTM();
        expect(motm).toBeUndefined();
    });

    test("should add the same member multiple times without duplicating in past-members", async () => {
        await setMOTM(testMember);
        const result = await setMOTM(testMember);
        expect(result).toBe(true);

        const pastMembersDoc = await getDoc(doc(db, "member-of-the-month", "past-members"));
        expect(pastMembersDoc.exists()).toBe(true);
        const pastMembers = pastMembersDoc.data()?.members;
        expect(pastMembers).toHaveLength(1);
        expect(pastMembers).toContain(MEMBER_UID);
    });

    test("should correctly populate past-members with multiple members set as MOTM", async () => {
        await setMOTM(testMember);
        await setMOTM(testMember2);

        const pastMembersDoc = await getDoc(doc(db, "member-of-the-month", "past-members"));
        expect(pastMembersDoc.exists()).toBe(true);
        const pastMembers = pastMembersDoc.data()?.members;
        expect(pastMembers).toHaveLength(2);
        expect(pastMembers).toContain(MEMBER_UID);
        expect(pastMembers).toContain(MEMBER_UID_2);
    });
});
