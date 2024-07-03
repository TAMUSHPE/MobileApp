import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { checkCommitteeRequestStatus, deleteCommittee, getCommittee, getCommitteeEvents, getCommitteeMembers, getCommittees, getLeads, getPublicUserData, getRepresentatives, getTeamMembers, removeCommitteeRequest, resetCommittee, setCommitteeData, submitCommitteeRequest } from "../../../api/firebaseUtils";
import { clearCollection, createTestUserInFirebase, generateTestCommittee, generateTestEvent, generateTestUsers, waitForUser } from "../../../helpers/unitTestUtils";


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
    await clearCollection("events")
});

describe("Get Committees", () => {
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

    })

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")
    });

    beforeEach(async () => {
        const headUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(headUser);
        await waitForUser(HEADUSER, 50);
    });

    test("Get committees returns empty array if no data", async () => {
        const committees = await getCommittees();
        expect(committees).toEqual([]);
    });

    test("Get committees with data", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER, 25);
        await setCommitteeData(committeeData);

        const committees = await getCommittees();
        expect(Array.isArray(committees)).toBe(true);
        expect(committees.length).toBeGreaterThan(0);

        if (committees.length > 0) {
            expect(committees[0]).toHaveProperty("firebaseDocName");
            expect(committees[0]).toHaveProperty("name");
        }
    }, 30000);

    test("Get committees sorted by memberCount", async () => {
        const SAMPLEFIREBASEDOCNAME1 = "SampleFirebaseDocName1";
        const SAMPLEFIREBASEDOCNAME2 = "SampleFirebaseDocName2";
        const committeeData1 = await generateTestCommittee({ firebaseDocName: SAMPLEFIREBASEDOCNAME1, memberCount: 5, head: HEADUSER });
        const committeeData2 = await generateTestCommittee({ firebaseDocName: SAMPLEFIREBASEDOCNAME2, memberCount: 15, head: HEADUSER });

        await waitForUser(HEADUSER, 25);
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
        await clearCollection("committees");
    });

    beforeEach(async () => {
        const headUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(headUser);
        await waitForUser(HEADUSER, 30);
    }, 30000)

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees");
    });

    test("with valid input", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER);
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    });

    test("with invalid head UID", async () => {
        const committeeData = await generateTestCommittee({ head: "invalidHeadUID" });
        await expect(setCommitteeData(committeeData)).rejects.toThrow("Bad Head UID");
    });

    test("with falsy firebaseDocName", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, firebaseDocName: "" });
        await waitForUser(HEADUSER);
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("Throws when not given a firebaseDocName", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, firebaseDocName: undefined });
        await waitForUser(HEADUSER);
        await expect(setCommitteeData(committeeData)).rejects.toThrow();
    });

    test("with missing optional fields", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER, color: undefined, logo: undefined });
        await waitForUser(HEADUSER);
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    }, 30000);

    test("with empty representatives and leads", async () => {
        await waitForUser(HEADUSER, 25);
        const committeeData = await generateTestCommittee({ head: HEADUSER, representatives: [], leads: [] });
        const result = await setCommitteeData(committeeData);
        expect(result).toBe(true);
    }, 30000);
});

describe("Delete and Reset Committee", () => {
    const HEADUSER = "HeadUser1";
    const TESTUSER1 = "TestUser1";
    const TESTUSER2 = "TestUser2";

    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees");

        const headuser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(headuser);
    });

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees");
    });

    test("Delete committee", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER);
        await setCommitteeData(committeeData);

        await deleteCommittee(committeeData.firebaseDocName!);
        const deletedCommittee = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        expect(deletedCommittee.exists()).toBe(false);
    });

    test("Reset committee", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER);
        await setCommitteeData(committeeData);

        await resetCommittee(committeeData.firebaseDocName!);
        const resetCommitteeData = await getDoc(doc(db, "committees", committeeData.firebaseDocName!));
        const data = resetCommitteeData.data();

        expect(data?.memberCount).toBe(0);
        expect(data?.applicationLink).toBe('');
        expect(data?.head).toBeUndefined();
        expect(data?.leads).toEqual([]);
        expect(data?.representatives).toEqual([]);
    }, 30000);

    test("Delete committee updates users' committee list", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER);
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
    }, 30000);

    test("Reset committee updates users' committee list", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER);
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
    }, 30000);
});


describe('getCommitteeMembers', () => {
    const HEADUSER = "HeadUser1";
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees")

        const headUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(headUser);
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
        await waitForUser(HEADUSER);
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
        await waitForUser(HEADUSER);
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
    const TESTUSER1REST = "TestUser1";
    const SAMPLEFIREBASEDOCNAMERESET = "SampleFirebaseDocNameReset";

    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("committees");

        // Create HEADUSER
        const headUser = await generateTestUsers({ publicInfo: { uid: HEADUSER } });
        await createTestUserInFirebase(headUser);
    });


    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("committees");
    });

    test("Can be deleted", async () => {
        const committeeData = await generateTestCommittee({ head: HEADUSER });
        await waitForUser(HEADUSER, 25);
        await setCommitteeData(committeeData);

        expect(await getCommittee(committeeData.firebaseDocName!)).not.toBeNull();

        await deleteCommittee(committeeData.firebaseDocName!);

        expect(await getCommittee(committeeData.firebaseDocName!)).toBeNull();
    });

    test("Can be reset", async () => {
        const committeeData = await generateTestCommittee({ firebaseDocName: SAMPLEFIREBASEDOCNAMERESET, head: HEADUSER });
        await waitForUser(HEADUSER);
        await setCommitteeData(committeeData);

        const testUserReset = await generateTestUsers({ publicInfo: { committees: [committeeData.firebaseDocName!], uid: TESTUSER1REST } });
        await createTestUserInFirebase(testUserReset);

        let committeeMemberInfo = await getPublicUserData(TESTUSER1REST);
        expect(committeeMemberInfo).toBeDefined();
        expect(committeeMemberInfo?.committees!).toContain(SAMPLEFIREBASEDOCNAMERESET);

        await resetCommittee(SAMPLEFIREBASEDOCNAMERESET);

        const obtainedCommitteeData = await getCommittee(SAMPLEFIREBASEDOCNAMERESET);
        expect(obtainedCommitteeData?.memberCount).toBeGreaterThanOrEqual(0);

        committeeMemberInfo = await getPublicUserData(TESTUSER1REST);
        expect(committeeMemberInfo).toBeDefined();
        expect(committeeMemberInfo?.committees!).not.toContain(SAMPLEFIREBASEDOCNAMERESET);
    });
});


describe("getCommitteeEvents", () => {
    const committee1 = "committee1";
    const committee2 = "committee2";
    const committee3 = "committee3";

    beforeEach(async () => {
        await clearCollection("events");
    });

    test("should fetch events for given committees", async () => {
        const event1 = generateTestEvent({ committee: committee1 });
        const event2 = generateTestEvent({ committee: committee2 });


        await setDoc(doc(collection(db, "events")), event1);
        await setDoc(doc(collection(db, "events")), event2);

        const events = await getCommitteeEvents([committee1, committee2]);

        expect(events.length).toBe(2);
    });

    test("with maxEvents limit", async () => {
        const event3 = generateTestEvent({ committee: committee3 });
        const event4 = generateTestEvent({ committee: committee3 });

        await setDoc(doc(collection(db, "events")), event3);
        await setDoc(doc(collection(db, "events")), event4);
        const events = await getCommitteeEvents([committee3], 1);

        expect(events.length).toBe(1);
    });

    test("should return an empty array if no events are found", async () => {
        const events = await getCommitteeEvents(["nonExistentCommittee"]);

        expect(events.length).toBe(0);
    });
});

describe("getLeads", () => {
    const LEAD_USER_UID = "LeadUser1";
    const NON_LEAD_USER_UID = "NonLeadUser";

    beforeAll(async () => {
        await clearCollection("users");
    });

    afterAll(async () => {
        await clearCollection("users");

    })

    beforeEach(async () => {
        const leadUser = await generateTestUsers({ publicInfo: { uid: LEAD_USER_UID, roles: { lead: true } } });
        const nonLeadUser = await generateTestUsers({ publicInfo: { uid: NON_LEAD_USER_UID, roles: { lead: false } } });

        await createTestUserInFirebase(leadUser);
        await createTestUserInFirebase(nonLeadUser);
        await waitForUser(LEAD_USER_UID);
        await waitForUser(NON_LEAD_USER_UID);
    })

    test("returns only users with lead role", async () => {
        const leads = await getLeads();
        expect(Array.isArray(leads)).toBe(true);
        expect(leads.length).toBe(1);
        expect(leads[0].uid).toBe(LEAD_USER_UID);
        expect(leads[0].roles?.lead).toBe(true);
    });
});


describe("getRepresentatives", () => {
    const REP_USER_UID = "RepUser1";
    const NON_REP_USER_UID = "NonRepUser";

    beforeAll(async () => {
        await clearCollection("users");
    });

    afterAll(async () => {
        await clearCollection("users");
    });

    beforeEach(async () => {
        const repUser = await generateTestUsers({ publicInfo: { uid: REP_USER_UID, roles: { representative: true } } });
        const nonRepUser = await generateTestUsers({ publicInfo: { uid: NON_REP_USER_UID, roles: { representative: false } } });

        await createTestUserInFirebase(repUser);
        await createTestUserInFirebase(nonRepUser);
        await waitForUser(REP_USER_UID);
        await waitForUser(NON_REP_USER_UID);
    })

    test("returns only users with representative role", async () => {
        const representatives = await getRepresentatives();
        expect(Array.isArray(representatives)).toBe(true);
        expect(representatives.length).toBe(1);
        expect(representatives[0].uid).toBe(REP_USER_UID);
        expect(representatives[0].roles?.representative).toBe(true);
    });
});

describe("getTeamMembers", () => {
    const OFFICER_USER_UID = "OfficerUser1";
    const LEAD_USER_UID = "LeadUser2";
    const REP_USER_UID = "RepUser2";
    const NON_TEAM_USER_UID = "NonTeamUser";

    beforeAll(async () => {
        await clearCollection("users");
    })

    afterAll(async () => {
        await clearCollection("users");
    })

    beforeEach(async () => {
        const officerUser = await generateTestUsers({ publicInfo: { uid: OFFICER_USER_UID, roles: { officer: true } } });
        const leadUser = await generateTestUsers({ publicInfo: { uid: LEAD_USER_UID, roles: { lead: true } } });
        const repUser = await generateTestUsers({ publicInfo: { uid: REP_USER_UID, roles: { representative: true } } });
        const nonTeamUser = await generateTestUsers({ publicInfo: { uid: NON_TEAM_USER_UID, roles: { officer: false, lead: false, representative: false } } });

        await createTestUserInFirebase(officerUser);
        await createTestUserInFirebase(leadUser);
        await createTestUserInFirebase(repUser);
        await createTestUserInFirebase(nonTeamUser);
        await waitForUser(OFFICER_USER_UID);
        await waitForUser(LEAD_USER_UID);
        await waitForUser(REP_USER_UID);
        await waitForUser(NON_TEAM_USER_UID);
    });

    test("returns only users with officer, lead, or representative roles", async () => {
        await clearCollection("users");

        const officerUser = await generateTestUsers({ publicInfo: { uid: OFFICER_USER_UID, roles: { officer: true } } });
        const leadUser = await generateTestUsers({ publicInfo: { uid: LEAD_USER_UID, roles: { lead: true } } });
        const repUser = await generateTestUsers({ publicInfo: { uid: REP_USER_UID, roles: { representative: true } } });
        const nonTeamUser = await generateTestUsers({ publicInfo: { uid: NON_TEAM_USER_UID, roles: { officer: false, lead: false, representative: false } } });

        await createTestUserInFirebase(officerUser);
        await createTestUserInFirebase(leadUser);
        await createTestUserInFirebase(repUser);
        await createTestUserInFirebase(nonTeamUser);
        await waitForUser(OFFICER_USER_UID);
        await waitForUser(LEAD_USER_UID);
        await waitForUser(REP_USER_UID);
        await waitForUser(NON_TEAM_USER_UID);

        const teamMembers = await getTeamMembers();
        expect(Array.isArray(teamMembers)).toBe(true);
        console.log("Team Member UIDs:", teamMembers.map(member => member.roles));
        expect(teamMembers.length).toBe(3);

        const teamMemberUIDs = teamMembers.map(member => member.uid);
        expect(teamMemberUIDs).toContain(OFFICER_USER_UID);
        expect(teamMemberUIDs).toContain(LEAD_USER_UID);
        expect(teamMemberUIDs).toContain(REP_USER_UID);
        expect(teamMemberUIDs).not.toContain(NON_TEAM_USER_UID);
    });
});

