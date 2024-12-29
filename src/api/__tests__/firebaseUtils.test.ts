import { signInAnonymously, signOut } from "firebase/auth";
import { checkCommitteeRequestStatus, createEvent, deleteCommittee, deleteUserResumeData, destroyEvent, fetchEventByName, fetchEventLogs, fetchLatestVersion, fetchLink, fetchOfficeCount, fetchOfficerStatus, fetchUsersWithPublicResumes, getAllFeedback, getAttendanceNumber, getCommittee, getCommitteeEvents, getCommitteeMembers, getCommittees, getEvent, getLeads, getMembersExcludeOfficers, getMembersToResumeVerify, getMembersToShirtVerify, getMembersToVerify, getMOTM, getMyEvents, getPastEvents, getPrivateUserData, getPublicUserData, getRepresentatives, getResumeVerificationStatus, getSortedUserData, getTeamMembers, getUpcomingEvents, getUser, getUserByEmail, getUserEventLog, getUserEventLogs, getUserForMemberList, getWeekPastEvents, initializeCurrentUserData, removeCommitteeRequest, removeFeedback, removeResumeVerificationDoc, resetCommittee, setCommitteeData, setEvent, setMOTM, setPublicUserData, submitCommitteeRequest, submitFeedback, updateLink, updateOfficerStatus, uploadResumeVerificationDoc } from "../firebaseUtils";
import { auth, db } from "../../config/firebaseConfig";
import { FilterRole, PrivateUserInfo, PublicUserInfo, User } from "../../types/user";
import { validateTamuEmail } from "../../helpers";
import { doc, setDoc, deleteDoc, getDoc, Timestamp, serverTimestamp, DocumentData, QueryDocumentSnapshot, collection, getDocs } from "firebase/firestore";
import { SHPEEvent, SHPEEventLog } from "../../types/events";
import { Committee } from "../../types/committees";
import { LinkData } from "../../types/links";

const testUserDataList: User[] = require("./test_data/users.json");
const testEvents = require('./test_data/events.json');

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

    await signInAnonymously(auth);
});

afterAll(async () => {
    await signOut(auth);
});

describe("User Info", () => {
    beforeEach(async () => {
        // Create fake user data
        for (const user of testUserDataList) {
            await setDoc(doc(db, "users", user.publicInfo!.uid!), user.publicInfo);
            await setDoc(doc(db, `users/${user.publicInfo!.uid!}/private`, "privateInfo"), user.private?.privateInfo);
        }
    });

    afterEach(async () => {
        // Clean up fake user data
        for (const user of testUserDataList) {
            await deleteDoc(doc(db, "users", user.publicInfo!.uid!));
            await deleteDoc(doc(db, `users/${user.publicInfo!.uid!}/private`, "privateInfo"));
        }
    });


    test("Initializes correctly and can be modified", async () => {
        expect(await getUserByEmail(auth.currentUser?.email!)).toBeNull();

        const user = await initializeCurrentUserData();
        expect(user).toBeDefined();

        expect(await initializeCurrentUserData()).toMatchObject(user);

        const userData = await getUser(auth.currentUser?.uid!);
        expect(userData).toBeDefined();
        expect(user).toMatchObject<User>(userData!);

        expect(auth.currentUser?.uid).toBeDefined();
        expect(auth.currentUser?.email).toBeDefined();
        expect(auth.currentUser?.displayName).toBeDefined();
        expect(auth.currentUser?.photoURL).toBeDefined();

        const publicUserData = await getPublicUserData();
        expect(publicUserData).toMatchObject<PublicUserInfo>({
            isStudent: validateTamuEmail(auth.currentUser?.email!),
            displayName: auth.currentUser?.displayName!,
            photoURL: auth.currentUser?.photoURL ?? "",
            isEmailPublic: false,
        });

        const privateUserData = await getPrivateUserData();
        expect(privateUserData).toMatchObject<PrivateUserInfo>({
            completedAccountSetup: false,
            email: auth.currentUser!.email!
        });

        expect(publicUserData).toMatchObject<PublicUserInfo>(user.publicInfo!);
        expect(privateUserData).toMatchObject<PrivateUserInfo>(user.private?.privateInfo!);

        expect(await getUserByEmail(auth.currentUser?.email!)).toBeNull();

        await setPublicUserData({
            email: auth.currentUser?.email!,
            isEmailPublic: true,
        });

        const updatedPublicUserData = await getPublicUserData();
        expect(updatedPublicUserData).not.toMatchObject(publicUserData!);
        expect(updatedPublicUserData).toMatchObject({
            ...publicUserData,
            email: auth.currentUser?.email,
            isEmailPublic: true,
        });

        const emailUserData = await getUserByEmail(auth.currentUser?.email!);
        expect(emailUserData).not.toBeFalsy();
        expect(emailUserData).toMatchObject({
            userData: {
                ...publicUserData,
                email: auth.currentUser?.email,
                isEmailPublic: true,
            },
            userUID: auth.currentUser?.uid
        });

        await deleteDoc(doc(db, "users", auth.currentUser?.uid!));
        await deleteDoc(doc(db, `users/${auth.currentUser?.uid!}/private`, "privateInfo"));

    });

    test("Can be seen by other users", async () => {
        const otherUserUID = "1234567890";
        const otherUserData: PublicUserInfo = {
            name: "Test",
            email: "bob@tamu.edu",
        };

        await setDoc(doc(db, "users", otherUserUID), otherUserData);

        const publicUserData = await getPublicUserData(otherUserUID);
        expect(publicUserData).toMatchObject(otherUserData);

        // Clean up
        await deleteDoc(doc(db, "users", otherUserUID));
    });
});

describe('Event Functions', () => {
    beforeEach(async () => {
        // Set up test data
        for (const event of testEvents) {
            await setDoc(doc(db, 'events', event.id), event);
        }
    });

    afterEach(async () => {
        // Clean up test data
        for (const event of testEvents) {
            await deleteDoc(doc(db, 'events', event.id));
        }
    });

    test('getEvent returns correct event', async () => {
        const event = await getEvent('event1');
        expect(event).toEqual(testEvents[0]);
    });

    test('getEvent returns null for non-existent event', async () => {
        const event = await getEvent('nonexistent');
        expect(event).toBeNull();
    });

    test('getUpcomingEvents returns future events', async () => {
        const currentDate = new Date();
        const futureDate1 = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days in the future
        const futureDate2 = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days in the future
        const futureDate3 = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in the future

        await setDoc(doc(db, 'events', 'event1'), { ...testEvents[0], startTime: Timestamp.fromDate(futureDate2), endTime: Timestamp.fromDate(new Date(futureDate2.getTime() + 86400000)) });
        await setDoc(doc(db, 'events', 'event2'), { ...testEvents[1], startTime: Timestamp.fromDate(futureDate1), endTime: Timestamp.fromDate(new Date(futureDate1.getTime() + 7200000)) });
        await setDoc(doc(db, 'events', 'event3'), { ...testEvents[2], startTime: Timestamp.fromDate(futureDate3), endTime: Timestamp.fromDate(new Date(futureDate3.getTime() + 7200000)) });

        const events = await getUpcomingEvents();
        expect(events.length).toBe(3);
        expect(events[0].name).toBe('General Body Meeting');
        expect(events[1].name).toBe('Resume Workshop');
        expect(events[2].name).toBe('SHPE National Convention 2024');
    });

    test('getUpcomingEvents returns only future events', async () => {
        const currentDate = new Date();
        const futureDate1 = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days in the future
        const futureDate2 = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days in the future
        const pastDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days in the past

        await setDoc(doc(db, 'events', 'event1'), { ...testEvents[0], startTime: Timestamp.fromDate(futureDate2), endTime: Timestamp.fromDate(new Date(futureDate2.getTime() + 86400000)) });
        await setDoc(doc(db, 'events', 'event2'), { ...testEvents[1], startTime: Timestamp.fromDate(futureDate1), endTime: Timestamp.fromDate(new Date(futureDate1.getTime() + 7200000)) });
        await setDoc(doc(db, 'events', 'event3'), { ...testEvents[2], startTime: Timestamp.fromDate(pastDate), endTime: Timestamp.fromDate(new Date(pastDate.getTime() + 86400000)) });

        const events = await getUpcomingEvents();
        expect(events.length).toBe(2);
        expect(events[0].name).toBe(testEvents[1].name);
        expect(events[1].name).toBe(testEvents[0].name);
        expect(events.some(event => event.name === testEvents[2].name)).toBe(false);
    });


    test('getWeekPastEvents returns events from the past week', async () => {
        const currentDate = new Date();
        const pastDate1 = new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days in the past
        const pastDate2 = new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days in the past
        const pastDate3 = new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 days in the past

        await setDoc(doc(db, 'events', 'event1'), { ...testEvents[0], startTime: Timestamp.fromDate(pastDate1), endTime: Timestamp.fromDate(new Date(pastDate1.getTime() + 86400000)) });
        await setDoc(doc(db, 'events', 'event2'), { ...testEvents[1], startTime: Timestamp.fromDate(pastDate2), endTime: Timestamp.fromDate(new Date(pastDate2.getTime() + 7200000)) });
        await setDoc(doc(db, 'events', 'event3'), { ...testEvents[2], startTime: Timestamp.fromDate(pastDate3), endTime: Timestamp.fromDate(new Date(pastDate3.getTime() + 7200000)) });

        const events = await getWeekPastEvents();
        expect(events.length).toBe(3);
        expect(events[0].name).toBe('General Body Meeting');
        expect(events[1].name).toBe('Resume Workshop');
        expect(events[2].name).toBe('SHPE National Convention 2024');

    });

    test('getWeekPastEvents returns only events from the past week', async () => {
        const currentDate = new Date();
        const pastDate1 = new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days in the past
        const pastDate2 = new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days in the past
        const futureDate = new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days in the future

        await setDoc(doc(db, 'events', 'event1'), { ...testEvents[0], startTime: Timestamp.fromDate(pastDate1), endTime: Timestamp.fromDate(new Date(pastDate1.getTime() + 86400000)) });
        await setDoc(doc(db, 'events', 'event2'), { ...testEvents[1], startTime: Timestamp.fromDate(pastDate2), endTime: Timestamp.fromDate(new Date(pastDate2.getTime() + 7200000)) });
        await setDoc(doc(db, 'events', 'event3'), { ...testEvents[2], startTime: Timestamp.fromDate(futureDate), endTime: Timestamp.fromDate(new Date(futureDate.getTime() + 7200000)) });

        const events = await getWeekPastEvents();
        expect(events.length).toBe(1);
        expect(events[0].name).toBe(testEvents[0].name);
    });

    test('getPastEvents returns past events with pagination', async () => {
        const currentDate = new Date();
        const pastDate1 = new Date(currentDate.getTime() - 11 * 24 * 60 * 60 * 1000); // 11 days in the past
        const pastDate2 = new Date(currentDate.getTime() - 16 * 24 * 60 * 60 * 1000); // 16 days in the past
        const pastDate3 = new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days in the past

        await setDoc(doc(db, 'events', 'event1'), { ...testEvents[0], startTime: Timestamp.fromDate(pastDate1), endTime: Timestamp.fromDate(new Date(pastDate1.getTime() + 86400000)) });
        await setDoc(doc(db, 'events', 'event2'), { ...testEvents[1], startTime: Timestamp.fromDate(pastDate2), endTime: Timestamp.fromDate(new Date(pastDate2.getTime() + 7200000)) });
        await setDoc(doc(db, 'events', 'event3'), { ...testEvents[2], startTime: Timestamp.fromDate(pastDate3), endTime: Timestamp.fromDate(new Date(pastDate3.getTime() + 7200000)) });

        const { events, lastVisibleDoc } = await getPastEvents(3, null);
        expect(events.length).toBe(3);
        expect(events[0].name).toBe('SHPE National Convention 2024');
        expect(events[1].name).toBe('Resume Workshop');
        expect(events[2].name).toBe('General Body Meeting');
        expect(lastVisibleDoc).toBeDefined();
    });

    test('getPastEvents returns past events with pagination', async () => {
        const currentDate = new Date();
        const pastDate1 = new Date(currentDate.getTime() - 11 * 24 * 60 * 60 * 1000); // 11 days in the past
        const pastDate2 = new Date(currentDate.getTime() - 16 * 24 * 60 * 60 * 1000); // 16 days in the past
        const pastDate3 = new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days in the past

        await setDoc(doc(db, 'events', 'event1'), { ...testEvents[0], startTime: Timestamp.fromDate(pastDate1), endTime: Timestamp.fromDate(new Date(pastDate1.getTime() + 86400000)) });
        await setDoc(doc(db, 'events', 'event2'), { ...testEvents[1], startTime: Timestamp.fromDate(pastDate2), endTime: Timestamp.fromDate(new Date(pastDate2.getTime() + 7200000)) });
        await setDoc(doc(db, 'events', 'event3'), { ...testEvents[2], startTime: Timestamp.fromDate(pastDate3), endTime: Timestamp.fromDate(new Date(pastDate3.getTime() + 7200000)) });

        const { events, lastVisibleDoc } = await getPastEvents(2, null);
        expect(events.length).toBe(2);
        expect(events[0].name).toBe('SHPE National Convention 2024');
        expect(events[1].name).toBe('Resume Workshop');
        expect(lastVisibleDoc).toBeDefined();

        // Check if lastVisibleDoc is correct
        const lastEvent = events[events.length - 1];
        expect(lastVisibleDoc.id).toBe(lastEvent.id);

        // Verify pagination by fetching the next event
        const { events: nextEvents, lastVisibleDoc: nextLastVisibleDoc } = await getPastEvents(1, lastVisibleDoc);
        expect(nextEvents.length).toBe(1);
        expect(nextEvents[0].name).toBe('General Body Meeting');
        expect(nextLastVisibleDoc).toBeDefined();
    });

    test('fetchEventByName returns correct event', async () => {
        const event = await fetchEventByName('Resume Workshop');
        expect(event).toEqual(testEvents[1]);
    });

    test('createEvent adds a new event', async () => {
        const newEvent: SHPEEvent = {
            name: 'New Event',
            description: 'Test event',
            startTime: Timestamp.fromDate(new Date('2024-12-01T10:00:00Z')),
            endTime: Timestamp.fromDate(new Date('2024-12-01T12:00:00Z')),
            locationName: 'Test Location'
        };

        const eventId = await createEvent(newEvent);
        expect(eventId).toBeDefined();

        const createdEvent = await getEvent(eventId!);
        expect(createdEvent).toMatchObject(newEvent);

        // Clean up
        await deleteDoc(doc(db, 'events', eventId!));
    });

    test('setEvent updates an existing event', async () => {
        const updatedEvent = {
            ...testEvents[0],
            description: 'Updated description'
        };

        const eventId = await setEvent('event1', updatedEvent);
        expect(eventId).toBe('event1');

        const event = await getEvent('event1');
        expect(event).toEqual(updatedEvent);
    });

    test('destroyEvent deletes an event and its related data', async () => {
        const testEvent = { ...testEvents[0], id: 'event1' };
        await setDoc(doc(db, 'events', testEvent.id), testEvent);

        const eventLog: SHPEEventLog = {
            uid: 'testUser',
            points: 50,
            signInTime: Timestamp.now(),
            signOutTime: Timestamp.now(),
            creationTime: Timestamp.now(),
            verified: true
        };
        await setDoc(doc(db, `events/${testEvent.id}/logs`, 'testUser'), eventLog);

        await setDoc(doc(db, 'users', 'testUser'), { name: 'Test User' });
        const userEventLog: SHPEEventLog = {
            eventId: testEvent.id,
            points: 50,
            signInTime: Timestamp.now(),
            signOutTime: Timestamp.now(),
            creationTime: Timestamp.now(),
            verified: true
        };
        await setDoc(doc(db, 'users/testUser/event-logs', testEvent.id), userEventLog);

        const result = await destroyEvent(testEvent.id);
        expect(result).toBe(true);

        const deletedEvent = await getEvent(testEvent.id);
        expect(deletedEvent).toBeNull();

        const userEventLogDoc = await getDoc(doc(db, 'users/testUser/event-logs', testEvent.id));
        expect(userEventLogDoc.exists()).toBe(false);

        // Clean up
        await deleteDoc(doc(db, 'users', 'testUser'));
    });
});



describe('Event Attendance Functions', () => {
    test('getAttendanceNumber returns correct attendance counts', async () => {
        const testEvent = { ...testEvents[0], id: 'testEventId' };
        await setDoc(doc(db, 'events', testEvent.id), testEvent);

        const logs = [
            {
                uid: 'user1',
                signInTime: Timestamp.now(),
                signOutTime: Timestamp.now()
            },
            {
                uid: 'user2',
                signInTime: Timestamp.now(),
                signOutTime: null
            },
            {
                uid: 'user3',
                signInTime: null,
                signOutTime: null
            }
        ];

        for (let i = 0; i < logs.length; i++) {
            await setDoc(doc(db, `events/${testEvent.id}/logs`, `log${i}`), logs[i]);
        }

        const attendance = await getAttendanceNumber(testEvent.id);
        expect(attendance.signedInCount).toBe(2);
        expect(attendance.signedOutCount).toBe(1);

        for (let i = 0; i < logs.length; i++) {
            await deleteDoc(doc(db, `events/${testEvent.id}/logs`, `log${i}`));
        }
        await deleteDoc(doc(db, 'events', testEvent.id));
    });

    test('getAttendanceNumber handles empty logs', async () => {
        const testEvent = { ...testEvents[0], id: 'emptyEventId' };
        await setDoc(doc(db, 'events', testEvent.id), testEvent);

        const attendance = await getAttendanceNumber(testEvent.id);
        expect(attendance.signedInCount).toBe(0);
        expect(attendance.signedOutCount).toBe(0);

        await deleteDoc(doc(db, 'events', testEvent.id));
    });
});


describe('Event Log Functions', () => {
    beforeEach(async () => {
        const testEvent = { ...testEvents[0], id: 'testEventId' };
        await setDoc(doc(db, 'events', testEvent.id), testEvent);

        const eventLog1: SHPEEventLog = {
            uid: 'user1',
            points: 50,
            signInTime: Timestamp.now(),
            signOutTime: Timestamp.now(),
            creationTime: Timestamp.now(),
            verified: true
        };
        const eventLog2: SHPEEventLog = {
            uid: 'user2',
            points: 30,
            signInTime: Timestamp.now(),
            creationTime: Timestamp.now(),
            verified: false
        };

        await setDoc(doc(db, `events/${testEvent.id}/logs`, 'user1'), eventLog1);
        await setDoc(doc(db, `events/${testEvent.id}/logs`, 'user2'), eventLog2);

        await setDoc(doc(db, 'users/user1/event-logs', testEvent.id), {
            ...eventLog1,
            eventId: testEvent.id
        });
        await setDoc(doc(db, 'users/user2/event-logs', testEvent.id), {
            ...eventLog2,
            eventId: testEvent.id
        });
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'events/testEventId'));
        await deleteDoc(doc(db, 'events/testEventId/logs/user1'));
        await deleteDoc(doc(db, 'events/testEventId/logs/user2'));
        await deleteDoc(doc(db, 'users/user1/event-logs/testEventId'));
        await deleteDoc(doc(db, 'users/user2/event-logs/testEventId'));
    });

    test('getUserEventLog returns correct log', async () => {
        const eventLog = await getUserEventLog('testEventId', 'user1');
        expect(eventLog).toBeDefined();
        expect(eventLog?.uid).toBe('user1');
        expect(eventLog?.points).toBe(50);
        expect(eventLog?.verified).toBe(true);
    });

    test('getUserEventLog returns null for non-existent log', async () => {
        const eventLog = await getUserEventLog('testEventId', 'nonexistentUser');
        expect(eventLog).toBeNull();
    });

    test('getUserEventLogs returns paginated events with correct data', async () => {
        const additionalEvents = [
            { id: 'event2', signInTime: Timestamp.fromDate(new Date(Date.now() - 86400000)) },
            { id: 'event3', signInTime: Timestamp.fromDate(new Date(Date.now() - 172800000)) },
            { id: 'event4', signInTime: Timestamp.fromDate(new Date(Date.now() - 259200000)) }
        ];

        for (const event of additionalEvents) {
            await setDoc(doc(db, 'users/user1/event-logs', event.id), {
                signInTime: event.signInTime,
                points: 10
            });
        }

        const firstPage = await getUserEventLogs('user1', 2);
        expect(firstPage.events).toHaveLength(2);
        expect(firstPage.lastVisibleDoc).toBeDefined();

        const secondPage = await getUserEventLogs('user1', 2, firstPage.lastVisibleDoc);
        expect(secondPage.events).toHaveLength(2);
        expect(secondPage.lastVisibleDoc).toBeDefined();

        expect(firstPage.events[0].eventLog?.signInTime?.toDate().getTime())
            .toBeGreaterThan(firstPage.events[1].eventLog?.signInTime?.toDate().getTime()!);

        for (const event of additionalEvents) {
            await deleteDoc(doc(db, 'users/user1/event-logs', event.id));
        }
    });

    test('getUserEventLogs handles end of data correctly', async () => {
        let endOfDataReached = false;
        const setEndOfData = (endOfData: boolean) => {
            endOfDataReached = endOfData;
        };

        const { events, lastVisibleDoc } = await getUserEventLogs('user1', 5, null, setEndOfData);
        expect(events.length).toBeLessThan(5);
        expect(endOfDataReached).toBe(true);
    });

    test('fetchEventLogs returns all user IDs', async () => {
        const userIds = await fetchEventLogs('testEventId');
        expect(userIds).toHaveLength(2);
        expect(userIds).toContain('user1');
        expect(userIds).toContain('user2');
    });
});

describe('Committee Functions', () => {
    const testCommittee: Committee = {
        firebaseDocName: 'testCommittee',
        name: 'Test Committee',
        color: '#500000',
        description: 'Test Description',
        head: 'testUser1',
        representatives: ['rep1', 'rep2'],
        leads: ['lead1', 'lead2'],
        applicationLink: 'https://test.com',
        logo: 'default',
        memberCount: 5,
        isOpen: true
    };

    beforeEach(async () => {
        await setDoc(doc(db, 'users', 'testUser1'), {
            uid: 'testUser1',
            committees: ['testCommittee']
        });
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'committees', testCommittee.firebaseDocName!));
        await deleteDoc(doc(db, 'users', 'testUser1'));
    });

    test('setCommitteeData creates and updates committee', async () => {
        const result = await setCommitteeData(testCommittee);
        expect(result).toBe(true);

        const committee = await getCommittee(testCommittee.firebaseDocName!);
        expect(committee).toMatchObject(testCommittee);
    });

    test('setCommitteeData throws error for non-existent head', async () => {
        const invalidCommittee = { ...testCommittee, head: 'nonexistentUser' };
        await expect(setCommitteeData(invalidCommittee)).rejects.toThrow('Bad Head UID');
    });

    test('setCommitteeData throws error for missing firebaseDocName', async () => {
        const invalidCommittee = { ...testCommittee, firebaseDocName: '' };
        await expect(setCommitteeData(invalidCommittee)).rejects.toThrow('Bad Document Name');
    });

    test('getCommittee returns null for non-existent committee', async () => {
        const committee = await getCommittee('nonexistentCommittee');
        expect(committee).toBeNull();
    });

    test('getCommittees returns sorted committees', async () => {
        const committee1 = { ...testCommittee, firebaseDocName: 'committee1', memberCount: 10 };
        const committee2 = { ...testCommittee, firebaseDocName: 'committee2', memberCount: 5 };
        const committee3 = { ...testCommittee, firebaseDocName: 'committee3', memberCount: 15 };

        await setCommitteeData(committee1);
        await setCommitteeData(committee2);
        await setCommitteeData(committee3);

        const committees = await getCommittees();
        expect(committees.length).toBe(3);
        expect(committees[0].memberCount).toBe(15);
        expect(committees[1].memberCount).toBe(10);
        expect(committees[2].memberCount).toBe(5);

        await deleteDoc(doc(db, 'committees', 'committee1'));
        await deleteDoc(doc(db, 'committees', 'committee2'));
        await deleteDoc(doc(db, 'committees', 'committee3'));
    });

    test('deleteCommittee removes committee and updates user references', async () => {
        await setCommitteeData(testCommittee);
        await setDoc(doc(db, 'users', 'member1'), {
            uid: 'member1',
            committees: ['testCommittee', 'otherCommittee']
        });

        await deleteCommittee(testCommittee.firebaseDocName!);

        const deletedCommittee = await getCommittee(testCommittee.firebaseDocName!);
        expect(deletedCommittee).toBeNull();

        const userDoc = await getDoc(doc(db, 'users', 'member1'));
        expect(userDoc.data()?.committees).not.toContain('testCommittee');

        await deleteDoc(doc(db, 'users', 'member1'));
    });

    test('resetCommittee clears committee data and updates user references', async () => {
        await setCommitteeData(testCommittee);
        await setDoc(doc(db, 'users', 'member1'), {
            uid: 'member1',
            committees: ['testCommittee', 'otherCommittee']
        });

        await resetCommittee(testCommittee.firebaseDocName!);

        const resetCommitteeData = await getCommittee(testCommittee.firebaseDocName!);
        expect(resetCommitteeData?.memberCount).toBe(0);
        expect(resetCommitteeData?.applicationLink).toBe('');
        expect(resetCommitteeData?.head).toBeUndefined();
        expect(resetCommitteeData?.leads).toEqual([]);
        expect(resetCommitteeData?.representatives).toEqual([]);

        const userDoc = await getDoc(doc(db, 'users', 'member1'));
        expect(userDoc.data()?.committees).not.toContain('testCommittee');

        await deleteDoc(doc(db, 'users', 'member1'));
    });
});


describe('Committee Events Functions', () => {
    const testCommittees = ['committee1', 'committee2'];
    const currentDate = new Date();

    beforeEach(async () => {
        const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
        const pastDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days in past

        await setDoc(doc(db, 'events', 'event1'), {
            ...testEvents[0],
            committee: 'committee1',
            startTime: Timestamp.fromDate(futureDate),
            endTime: Timestamp.fromDate(new Date(futureDate.getTime() + 86400000))
        });

        await setDoc(doc(db, 'events', 'event2'), {
            ...testEvents[1],
            committee: 'committee2',
            startTime: Timestamp.fromDate(futureDate),
            endTime: Timestamp.fromDate(new Date(futureDate.getTime() + 86400000))
        });

        await setDoc(doc(db, 'events', 'event3'), {
            ...testEvents[2],
            committee: 'committee1',
            startTime: Timestamp.fromDate(pastDate),
            endTime: Timestamp.fromDate(new Date(pastDate.getTime() + 86400000))
        });
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'events', 'event1'));
        await deleteDoc(doc(db, 'events', 'event2'));
        await deleteDoc(doc(db, 'events', 'event3'));
    });

    test('getCommitteeEvents returns only future events for specified committees', async () => {
        const events = await getCommitteeEvents(testCommittees);

        expect(events.length).toBe(2);
        expect(events.some(event => event.committee === 'committee1')).toBe(true);
        expect(events.some(event => event.committee === 'committee2')).toBe(true);
        expect(events.every(event => event.endTime.toDate() > currentDate)).toBe(true);
    });

    test('getCommitteeEvents returns empty array for non-existent committee', async () => {
        const events = await getCommitteeEvents(['nonexistentCommittee']);
        expect(events).toEqual([]);
    });

    test('getCommitteeEvents returns empty array for empty committee list', async () => {
        const events = await getCommitteeEvents([]);
        expect(events).toEqual([]);
    });
});


describe('Committee User Functions', () => {
    const testUsers = [
        {
            uid: 'user1',
            name: 'Lead User',
            roles: { lead: true, officer: false, representative: false },
            committees: ['committee1']
        },
        {
            uid: 'user2',
            name: 'Rep User',
            roles: { lead: false, officer: false, representative: true },
            committees: ['committee1', 'committee2']
        },
        {
            uid: 'user3',
            name: 'Officer User',
            roles: { lead: false, officer: true, representative: false },
            committees: ['committee2']
        },
        {
            uid: 'user4',
            name: 'Regular User',
            roles: { lead: false, officer: false, representative: false },
            committees: []
        }
    ];

    beforeEach(async () => {
        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid), user);
        }
    });

    afterEach(async () => {
        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid));
        }
    });

    test('getLeads returns only users with lead role', async () => {
        const leads = await getLeads();
        expect(leads.length).toBe(1);
        expect(leads[0].uid).toBe('user1');
        expect(leads[0].roles?.lead).toBe(true);
    });

    test('getRepresentatives returns only users with representative role', async () => {
        const representatives = await getRepresentatives();
        expect(representatives.length).toBe(1);
        expect(representatives[0].uid).toBe('user2');
        expect(representatives[0].roles?.representative).toBe(true);
    });

    test('getTeamMembers returns users with officer, lead, or representative roles', async () => {
        const teamMembers = await getTeamMembers();
        expect(teamMembers.length).toBe(3);
        expect(teamMembers.some(user => user.uid === 'user1')).toBe(true);
        expect(teamMembers.some(user => user.uid === 'user2')).toBe(true);
        expect(teamMembers.some(user => user.uid === 'user3')).toBe(true);
        expect(teamMembers.some(user => user.uid === 'user4')).toBe(false);
    });

    test('getCommitteeMembers returns users in specific committee', async () => {
        const committee1Members = await getCommitteeMembers('committee1');
        expect(committee1Members.length).toBe(2);
        expect(committee1Members.some(user => user.uid === 'user1')).toBe(true);
        expect(committee1Members.some(user => user.uid === 'user2')).toBe(true);

        const committee2Members = await getCommitteeMembers('committee2');
        expect(committee2Members.length).toBe(2);
        expect(committee2Members.some(user => user.uid === 'user2')).toBe(true);
        expect(committee2Members.some(user => user.uid === 'user3')).toBe(true);
    });

    test('functions return empty array when no users match criteria', async () => {
        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid));
        }

        const leads = await getLeads();
        const representatives = await getRepresentatives();
        const teamMembers = await getTeamMembers();
        const committeeMembers = await getCommitteeMembers('committee1');

        expect(leads.length).toBe(0);
        expect(representatives.length).toBe(0);
        expect(teamMembers.length).toBe(0);
        expect(committeeMembers.length).toBe(0);
    });
});


describe('Committee Request Functions', () => {
    const testCommittee = 'testCommittee';
    const testUserId = 'testUser123';

    afterEach(async () => {
        await deleteDoc(doc(db, `committeeVerification/${testCommittee}/requests/${testUserId}`));
    });

    test('submitCommitteeRequest creates request document', async () => {
        await submitCommitteeRequest(testCommittee, testUserId);

        const requestExists = await checkCommitteeRequestStatus(testCommittee, testUserId);
        expect(requestExists).toBe(true);

        const requestDoc = await getDoc(doc(db, `committeeVerification/${testCommittee}/requests/${testUserId}`));
        const data = requestDoc.data();
        expect(data).toBeDefined();
        expect(data?.uploadDate).toBeDefined();
    });

    test('checkCommitteeRequestStatus returns false for non-existent request', async () => {
        const requestExists = await checkCommitteeRequestStatus(testCommittee, 'nonexistentUser');
        expect(requestExists).toBe(false);
    });

    test('removeCommitteeRequest deletes request document', async () => {
        await submitCommitteeRequest(testCommittee, testUserId);
        let requestExists = await checkCommitteeRequestStatus(testCommittee, testUserId);
        expect(requestExists).toBe(true);

        await removeCommitteeRequest(testCommittee, testUserId);
        requestExists = await checkCommitteeRequestStatus(testCommittee, testUserId);
        expect(requestExists).toBe(false);
    });
});


describe('Link Management Functions', () => {
    const testLink: LinkData = {
        id: 'testLinkId',
        name: 'Test Link',
        url: 'https://test.com',
        imageUrl: 'https://test.com/image.jpg'
    };

    beforeEach(async () => {
        await setDoc(doc(db, 'links', testLink.id), testLink);
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'links', testLink.id));
    });

    test('fetchLink returns correct link data', async () => {
        const link = await fetchLink(testLink.id);
        expect(link).toBeDefined();
        expect(link).toMatchObject(testLink);
    });

    test('fetchLink returns null for non-existent link', async () => {
        const link = await fetchLink('nonexistentLink');
        expect(link).toBeNull();
    });

    test('updateLink updates existing link without image', async () => {
        const updatedLink: LinkData = {
            ...testLink,
            name: 'Updated Link Name',
            url: 'https://updated-test.com'
        };

        await updateLink(updatedLink);
        const link = await fetchLink(testLink.id);

        expect(link).toBeDefined();
        expect(link?.name).toBe(updatedLink.name);
        expect(link?.url).toBe(updatedLink.url);
        expect(link?.imageUrl).toBe(testLink.imageUrl);
    });

    test('updateLink merges data correctly', async () => {
        const partialUpdate: LinkData = {
            id: testLink.id,
            name: 'Partially Updated Link',
            url: testLink.url,
            imageUrl: testLink.imageUrl
        };

        await updateLink(partialUpdate);
        const link = await fetchLink(testLink.id);

        expect(link).toBeDefined();
        expect(link?.name).toBe(partialUpdate.name);
        expect(link?.url).toBe(testLink.url);
        expect(link?.imageUrl).toBe(testLink.imageUrl);
    });

    test('updateLink handles empty imageUrl', async () => {
        const linkWithoutImage: LinkData = {
            ...testLink,
            imageUrl: ''
        };

        await updateLink(linkWithoutImage);
        const link = await fetchLink(testLink.id);

        expect(link).toBeDefined();
        expect(link?.imageUrl).toBe('');
    });
});




describe('Points Leaderboard Functions', () => {
    const testUsers = [
        {
            uid: 'user1',
            name: 'User One',
            points: 100,
            pointsThisMonth: 50
        },
        {
            uid: 'user2',
            name: 'User Two',
            points: 80,
            pointsThisMonth: 70
        },
        {
            uid: 'user3',
            name: 'User Three',
            points: 60,
            pointsThisMonth: 30
        },
        {
            uid: 'user4',
            name: 'User Four',
            points: 40,
            pointsThisMonth: 40
        }
    ];

    beforeEach(async () => {
        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid), user);
        }
    });

    afterEach(async () => {
        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid));
        }
    });

    test('getSortedUserData returns users sorted by all-time points', async () => {
        const { data, lastVisible } = await getSortedUserData(2, null, 'allTime');

        expect(data.length).toBe(2);
        expect(data[0].points).toBe(100);
        expect(data[1].points).toBe(80);
        expect(lastVisible).toBeDefined();
    });

    test('getSortedUserData returns users sorted by monthly points', async () => {
        const { data, lastVisible } = await getSortedUserData(2, null, 'monthly');

        expect(data.length).toBe(2);
        expect(data[0].pointsThisMonth).toBe(70);
        expect(data[1].pointsThisMonth).toBe(50);
        expect(lastVisible).toBeDefined();
    });

    test('getSortedUserData handles pagination for all-time points', async () => {
        const firstPage = await getSortedUserData(2, null, 'allTime');
        expect(firstPage.data.length).toBe(2);
        expect(firstPage.lastVisible).toBeDefined();

        const secondPage = await getSortedUserData(2, firstPage.lastVisible, 'allTime');
        expect(secondPage.data.length).toBe(2);
        expect(secondPage.data[0].points).toBe(60);
        expect(secondPage.data[1].points).toBe(40);
    });

    test('getSortedUserData returns empty array when no more data', async () => {
        const { data, lastVisible } = await getSortedUserData(5, null, 'allTime');

        const emptyPage = await getSortedUserData(5, lastVisible, 'allTime');
        expect(emptyPage.data.length).toBe(0);
        expect(emptyPage.lastVisible).toBeNull();
    });
});


describe('Resume Functions', () => {
    const testUser = {
        uid: 'testUser123',
        resumePublicURL: 'https://test.com/resume.pdf',
        resumeVerified: true,
        major: 'Computer Science',
        classYear: '2024',
        displayName: 'Test User',
        email: 'test@test.com',
        isEmailPublic: true,
        isStudent: false,
        photoURL: '',
        roles: {
            admin: false,
            developer: false,
            lead: false,
            officer: false,
            reader: true,
            representative: false
        }
    };


    beforeEach(async () => {
        await setDoc(doc(db, 'users', testUser.uid), testUser);
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'users', testUser.uid));
        await deleteDoc(doc(db, 'resumeVerification', testUser.uid));
    });

    test('getResumeVerificationStatus returns correct status', async () => {
        let status = await getResumeVerificationStatus(testUser.uid);
        expect(status).toBe(false);

        await setDoc(doc(db, 'resumeVerification', testUser.uid), {
            uploadDate: new Date().toISOString(),
            resumePublicURL: 'https://test.com/resume.pdf'
        });

        status = await getResumeVerificationStatus(testUser.uid);
        expect(status).toBe(true);
    });

    test('deleteUserResumeData removes resume fields', async () => {
        await deleteUserResumeData(testUser.uid);

        const userDoc = await getDoc(doc(db, 'users', testUser.uid));
        const userData = userDoc.data();

        expect(userData?.resumePublicURL).toBeUndefined();
        expect(userData?.resumeVerified).toBe(false);
    });

    test('removeResumeVerificationDoc deletes verification document', async () => {
        await setDoc(doc(db, 'resumeVerification', testUser.uid), {
            uploadDate: new Date().toISOString(),
            resumePublicURL: 'https://test.com/resume.pdf'
        });

        await removeResumeVerificationDoc(testUser.uid);

        const verificationDoc = await getDoc(doc(db, 'resumeVerification', testUser.uid));
        expect(verificationDoc.exists()).toBe(false);
    });

    test('uploadResumeVerificationDoc creates verification document', async () => {
        const testUrl = 'https://test.com/newresume.pdf';
        await uploadResumeVerificationDoc(testUser.uid, testUrl);

        const verificationDoc = await getDoc(doc(db, 'resumeVerification', testUser.uid));
        const data = verificationDoc.data();

        expect(verificationDoc.exists()).toBe(true);
        expect(data?.resumePublicURL).toBe(testUrl);
        expect(data?.uploadDate).toBeDefined();
    });

    test('fetchUsersWithPublicResumes returns filtered users', async () => {
        const testUsers: PublicUserInfo[] = [
            {
                uid: 'user1',
                displayName: 'Test User 1',
                email: 'test1@test.com',
                photoURL: '',
                resumeVerified: true,
                major: 'Computer Science',
                classYear: '2024',
                isStudent: true,
                isEmailPublic: false,
                points: 0,
                pointsThisMonth: 0,
                roles: {
                    admin: false,
                    developer: false,
                    lead: false,
                    officer: false,
                    reader: false,
                    representative: false
                }
            },
            {
                uid: 'user2',
                displayName: 'Test User 2',
                email: 'test2@test.com',
                photoURL: '',
                resumeVerified: false,
                major: 'Mechanical Engineering',
                classYear: '2024',
                isStudent: true,
                isEmailPublic: false,
                points: 0,
                pointsThisMonth: 0,
                roles: {
                    admin: false,
                    developer: false,
                    lead: false,
                    officer: false,
                    reader: false,
                    representative: false
                }
            }
        ];

        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid!), user);
        }

        let users = (await fetchUsersWithPublicResumes(null)) as PublicUserInfo[];
        expect(users.length).toBe(2);
        expect(users.every(user => user.resumeVerified)).toBe(true);

        users = (await fetchUsersWithPublicResumes({ major: 'Computer Science' })) as PublicUserInfo[];
        expect(users.length).toBe(2);
        expect(users[0].major).toBe('Computer Science');

        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid!));
        }
    });
});


describe('Office Hours Functions', () => {
    const testOfficer = {
        uid: 'testOfficer123',
        signedIn: true,
        timestamp: serverTimestamp()
    };

    beforeEach(async () => {
        await setDoc(doc(db, 'office-hours', testOfficer.uid), testOfficer);
    });

    afterEach(async () => {
        await deleteDoc(doc(db, 'office-hours', testOfficer.uid));
    });

    test('fetchOfficeCount returns correct number of signed-in officers', async () => {
        const additionalOfficers = [
            { uid: 'officer1', signedIn: true, timestamp: serverTimestamp() },
            { uid: 'officer2', signedIn: false, timestamp: serverTimestamp() },
            { uid: 'officer3', signedIn: true, timestamp: serverTimestamp() }
        ];

        for (const officer of additionalOfficers) {
            await setDoc(doc(db, 'office-hours', officer.uid), officer);
        }

        const count = await fetchOfficeCount();
        expect(count).toBe(3);

        for (const officer of additionalOfficers) {
            await deleteDoc(doc(db, 'office-hours', officer.uid));
        }
    });

    test('fetchOfficerStatus returns correct officer status', async () => {
        const status = await fetchOfficerStatus(testOfficer.uid);
        expect(status).toBeDefined();
        expect(status?.signedIn).toBe(true);
        expect(status?.timestamp).toBeDefined();
    });

    test('fetchOfficerStatus returns null for non-existent officer', async () => {
        const status = await fetchOfficerStatus('nonexistentOfficer');
        expect(status).toBeNull();
    });

    test('updateOfficerStatus updates officer sign-in status', async () => {
        await updateOfficerStatus(testOfficer.uid, false);

        const status = await fetchOfficerStatus(testOfficer.uid);
        expect(status?.signedIn).toBe(false);
        expect(status?.timestamp).toBeDefined();

        const count = await fetchOfficeCount();
        expect(count).toBe(0);

        await updateOfficerStatus(testOfficer.uid, true);

        const updatedStatus = await fetchOfficerStatus(testOfficer.uid);
        expect(updatedStatus?.signedIn).toBe(true);
        expect(updatedStatus?.timestamp).toBeDefined();

        const updatedCount = await fetchOfficeCount();
        expect(updatedCount).toBe(1);
    });
});


describe('My Events Functions', () => {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 86400000);

    const testEvents = [
        {
            id: 'event1',
            name: 'Committee Event 1',
            committee: 'committee1',
            eventType: 'Workshop',
            endTime: Timestamp.fromDate(futureDate)
        },
        {
            id: 'event2',
            name: 'Committee Event 2',
            committee: 'committee2',
            eventType: 'Social',
            endTime: Timestamp.fromDate(futureDate)
        },
        {
            id: 'event3',
            name: 'Interest Event',
            committee: 'committee3',
            eventType: 'Workshop',
            endTime: Timestamp.fromDate(futureDate)
        }
    ];

    beforeEach(async () => {
        for (const event of testEvents) {
            await setDoc(doc(db, 'events', event.id), event);
        }
    });

    afterEach(async () => {
        for (const event of testEvents) {
            await deleteDoc(doc(db, 'events', event.id));
        }
    });

    test('getMyEvents returns events based on committees only', async () => {
        const committees = ['committee1', 'committee2'];
        const interests: string[] = [];

        const events = await getMyEvents(committees, interests);
        expect(events.length).toBe(2);
        expect(events.some(event => event.id === 'event1')).toBe(true);
        expect(events.some(event => event.id === 'event2')).toBe(true);
    });

    test('getMyEvents returns events based on interests only', async () => {
        const committees: string[] = [];
        const interests = ['Workshop'];

        const events = await getMyEvents(committees, interests);
        expect(events.length).toBe(2);
        expect(events.some(event => event.id === 'event1')).toBe(true);
        expect(events.some(event => event.id === 'event3')).toBe(true);
    });

    test('getMyEvents returns combined events without duplicates', async () => {
        const committees = ['committee1'];
        const interests = ['Workshop'];

        const events = await getMyEvents(committees, interests);
        expect(events.length).toBe(2);
        expect(events.some(event => event.id === 'event1')).toBe(true);
        expect(events.some(event => event.id === 'event3')).toBe(true);
    });

    test('getMyEvents respects maxEvents limit', async () => {
        const committees = ['committee1', 'committee2'];
        const interests = ['Workshop', 'Social'];
        const maxEvents = 2;

        const events = await getMyEvents(committees, interests, maxEvents);
        expect(events.length).toBe(2);
    });

    test('getMyEvents returns empty array for non-matching criteria', async () => {
        const committees = ['nonexistentCommittee'];
        const interests = ['nonexistentType'];

        const events = await getMyEvents(committees, interests);
        expect(events.length).toBe(0);
    });
});


describe('Member List Function', () => {
    const testUsers: PublicUserInfo[] = [
        {
            uid: 'user1',
            name: 'Aaron Brown',
            roles: {
                officer: true,
                representative: false,
                lead: false
            }
        },
        {
            uid: 'user2',
            name: 'Bob Smith',
            roles: {
                officer: false,
                representative: true,
                lead: false
            }
        },
        {
            uid: 'user3',
            name: 'Charlie Davis',
            roles: {
                officer: false,
                representative: false,
                lead: true
            }
        },
        {
            uid: 'user4',
            name: 'David Wilson',
            roles: {
                officer: true,
                representative: false,
                lead: false
            }
        }
    ];

    beforeEach(async () => {
        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid!), user);
        }
    });

    afterEach(async () => {
        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid!));
        }
    });

    test('returns paginated users without filter', async () => {
        const { members, lastVisibleDoc } = await getUserForMemberList(2, null, null) as {
            members: PublicUserInfo[],
            lastVisibleDoc: QueryDocumentSnapshot<DocumentData>
        };

        expect(members.length).toBe(2);
        expect(members[0].name).toBe('Aaron Brown');
        expect(members[1].name).toBe('Bob Smith');
        expect(lastVisibleDoc).toBeDefined();

        const nextPage = await getUserForMemberList(2, lastVisibleDoc, null) as {
            members: PublicUserInfo[],
            lastVisibleDoc: QueryDocumentSnapshot<DocumentData>
        };
        ;
        expect(nextPage.members.length).toBe(2);
        expect(nextPage.members[0].name).toBe('Charlie Davis');
        expect(nextPage.members[1].name).toBe('David Wilson');
    });

    test('returns filtered users by role', async () => {
        const { members } = await getUserForMemberList(10, null, FilterRole.OFFICER) as {
            members: PublicUserInfo[],
            lastVisibleDoc: QueryDocumentSnapshot<DocumentData>
        };

        expect(members.length).toBe(2);
        expect(members.every(member => member.roles?.officer)).toBe(true);
        expect(members[0].name).toBe('Aaron Brown');
        expect(members[1].name).toBe('David Wilson');
    });

    test('handles end of data correctly', async () => {
        let endOfDataReached = false;
        const setEndOfData = (endOfData: boolean) => {
            endOfDataReached = endOfData;
        };

        const { members } = await getUserForMemberList(5, null, null, setEndOfData);
        expect(members.length).toBe(4);
        expect(endOfDataReached).toBe(true);
    });

    test('returns empty array when no users match filter', async () => {
        // Delete all test users first
        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid!));
        }

        const { members, lastVisibleDoc } = await getUserForMemberList(5, null, FilterRole.OFFICER);
        expect(members.length).toBe(0);
        expect(lastVisibleDoc).toBeUndefined();
    });

    test('handles pagination with filtered results', async () => {
        const { members, lastVisibleDoc } = await getUserForMemberList(1, null, FilterRole.OFFICER) as {
            members: PublicUserInfo[],
            lastVisibleDoc: QueryDocumentSnapshot<DocumentData>
        };

        expect(members.length).toBe(1);
        expect(members[0].roles?.officer).toBe(true);
        expect(lastVisibleDoc).toBeDefined();

        const nextPage = await getUserForMemberList(1, lastVisibleDoc, FilterRole.OFFICER) as {
            members: PublicUserInfo[],
            lastVisibleDoc: QueryDocumentSnapshot<DocumentData>
        };

        expect(nextPage.members.length).toBe(1);
        expect(nextPage.members[0].roles?.officer).toBe(true);
    });
});


describe('Member of the Month Functions', () => {
    const testMember: PublicUserInfo = {
        uid: 'testUser123',
        displayName: 'Test User',
        email: 'test@test.com',
        photoURL: '',
        isStudent: true,
        isEmailPublic: false,
        roles: {
            admin: false,
            developer: false,
            lead: false,
            officer: false,
            reader: false,
            representative: false
        }
    };

    afterEach(async () => {
        await deleteDoc(doc(db, 'member-of-the-month', 'member'));
        await deleteDoc(doc(db, 'member-of-the-month', 'past-members'));
    });

    test('setMOTM sets current member and updates past members', async () => {
        const result = await setMOTM(testMember);
        expect(result).toBe(true);

        const currentMOTM = await getMOTM();
        expect(currentMOTM).toMatchObject(testMember);

        const pastMembersDoc = await getDoc(doc(db, 'member-of-the-month', 'past-members'));
        const pastMembers = pastMembersDoc.data()?.members || [];
        expect(pastMembers).toContain(testMember.uid);
    });

    test('getMOTM returns undefined for non-existent member', async () => {
        const member = await getMOTM();
        expect(member).toBeUndefined();
    });
});

describe('Feedback Functions', () => {
    const testUser: User = {
        publicInfo: {
            uid: 'testUser123',
            displayName: 'Test User',
            email: 'test@test.com',
            photoURL: '',
            isStudent: true,
            isEmailPublic: false,
            roles: {
                admin: false,
                developer: false,
                lead: false,
                officer: false,
                reader: false,
                representative: false
            }
        }
    };

    afterEach(async () => {
        // Clean up test feedback
        const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
        const deletePromises = feedbackSnapshot.docs.map(doc =>
            deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
    });

    test('submitFeedback creates feedback document', async () => {
        const result = await submitFeedback('Test feedback message', testUser);
        expect(result.success).toBe(true);

        const feedbackList = await getAllFeedback();
        expect(feedbackList.length).toBe(1);
        expect(feedbackList[0].message).toBe('Test feedback message');
        expect(feedbackList[0].user).toMatchObject(testUser.publicInfo!);
    });

    test('getAllFeedback returns all feedback documents', async () => {
        // Create multiple feedback entries
        await submitFeedback('Feedback 1', testUser);
        await submitFeedback('Feedback 2', testUser);

        const feedbackList = await getAllFeedback();
        expect(feedbackList.length).toBe(2);
        expect(feedbackList.map(f => f.message)).toContain('Feedback 1');
        expect(feedbackList.map(f => f.message)).toContain('Feedback 2');
    });

    test('removeFeedback deletes feedback document', async () => {
        await submitFeedback('Test feedback', testUser);
        const initialFeedbackList = await getAllFeedback();
        expect(initialFeedbackList.length).toBe(1);

        await removeFeedback(initialFeedbackList[0].id);

        const updatedFeedbackList = await getAllFeedback();
        expect(updatedFeedbackList.length).toBe(0);
    });
});



describe('Version Functions', () => {
    const testConfig = {
        latestVersion: '1.2.3'
    };

    afterEach(async () => {
        await deleteDoc(doc(db, 'config', 'global'));
    });

    test('fetchLatestVersion returns correct version when config exists', async () => {
        await setDoc(doc(db, 'config', 'global'), testConfig);

        const version = await fetchLatestVersion();
        expect(version).toBe('1.2.3');
    });

    test('fetchLatestVersion returns null when config does not exist', async () => {
        const version = await fetchLatestVersion();
        expect(version).toBeNull();
    });

    test('fetchLatestVersion returns null on error', async () => {
        await setDoc(doc(db, 'config', 'global'), { latestVersion: null });

        const version = await fetchLatestVersion();
        expect(version).toBeNull();
    });
});


describe('Member Fetch Functions', () => {
    const testUsers: PublicUserInfo[] = [
        {
            uid: 'user1',
            displayName: 'Alice Smith',
            name: 'Alice Smith',
            email: 'alice@test.com',
            photoURL: '',
            isStudent: true,
            isEmailPublic: false,
            roles: {
                officer: false,
                representative: false,
                lead: false
            }
        },
        {
            uid: 'user2',
            displayName: 'Bob Officer',
            name: 'Bob Officer',
            email: 'bob@test.com',
            photoURL: '',
            isStudent: true,
            isEmailPublic: false,
            roles: {
                officer: true,
                representative: false,
                lead: false
            }
        }
    ];

    beforeEach(async () => {
        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid!), user);
        }
    });

    afterEach(async () => {
        // Clean up test data
        for (const user of testUsers) {
            await deleteDoc(doc(db, 'users', user.uid!));
            await deleteDoc(doc(db, 'memberSHPE', user.uid!));
            await deleteDoc(doc(db, 'resumeVerification', user.uid!));
            await deleteDoc(doc(db, 'shirt-sizes', user.uid!));
        }
    });

    test('getMembersExcludeOfficers returns only non-officer members', async () => {
        const members = await getMembersExcludeOfficers();
        expect(members.length).toBe(1);
        expect(members[0].uid).toBe('user1');
        expect(members[0].roles?.officer).toBe(false);
    });

    test('getMembersToVerify returns members with valid URLs', async () => {
        await setDoc(doc(db, 'memberSHPE', 'user1'), {
            nationalURL: 'http://national.com',
            chapterURL: 'http://chapter.com'
        });
        await setDoc(doc(db, 'memberSHPE', 'user2'), {
            nationalURL: 'http://national.com'
        });

        const members = await getMembersToVerify();
        expect(members.length).toBe(1);
        expect(members[0].uid).toBe('user1');
    });

    test('getMembersToResumeVerify returns members with resume verification', async () => {
        await setDoc(doc(db, 'resumeVerification', 'user1'), {
            uploadDate: new Date().toISOString()
        });

        const members = await getMembersToResumeVerify();
        expect(members.length).toBe(1);
        expect(members[0].uid).toBe('user1');
    });

    test('getMembersToShirtVerify separates members by pickup status', async () => {
        await setDoc(doc(db, 'shirt-sizes', 'user1'), {
            size: 'M',
            shirtPickedUp: true
        });
        await setDoc(doc(db, 'shirt-sizes', 'user2'), {
            size: 'L',
            shirtPickedUp: false
        });

        const { pickedUp, notPickedUp } = await getMembersToShirtVerify();
        expect(pickedUp.length).toBe(1);
        expect(notPickedUp.length).toBe(1);
        expect(pickedUp[0].uid).toBe('user1');
        expect(notPickedUp[0].uid).toBe('user2');
    });

    test('getMembersToShirtVerify handles empty data', async () => {
        const { pickedUp, notPickedUp } = await getMembersToShirtVerify();
        expect(pickedUp.length).toBe(0);
        expect(notPickedUp.length).toBe(0);
    });
});
