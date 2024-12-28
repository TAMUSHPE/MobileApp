import { signInAnonymously, signOut } from "firebase/auth";
import { checkCommitteeRequestStatus, createEvent, deleteCommittee, destroyEvent, fetchEventByName, fetchEventLogs, fetchLink, getAttendanceNumber, getCommittee, getCommitteeEvents, getCommitteeMembers, getCommittees, getEvent, getLeads, getPastEvents, getPrivateUserData, getPublicUserData, getRepresentatives, getTeamMembers, getUpcomingEvents, getUser, getUserByEmail, getUserEventLog, getUserEventLogs, getWeekPastEvents, initializeCurrentUserData, removeCommitteeRequest, resetCommittee, setCommitteeData, setEvent, setPublicUserData, submitCommitteeRequest, updateLink } from "../firebaseUtils";
import { auth, db } from "../../config/firebaseConfig";
import { PrivateUserInfo, PublicUserInfo, User } from "../../types/user";
import { validateTamuEmail } from "../../helpers";
import { doc, setDoc, deleteDoc, getDoc, Timestamp, getDocs, collection } from "firebase/firestore";
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


