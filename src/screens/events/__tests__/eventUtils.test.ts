import { Timestamp, GeoPoint, deleteDoc, doc, getDoc, setDoc, collection, getFirestore, getDocs, query } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { createEvent, getUpcomingEvents, getPastEvents, setEvent, getEvent, destroyEvent, getAttendanceNumber, getUserEventLog, fetchEventByName, getMyEvents, getUserEventLogs } from "../../../api/firebaseUtils";
import { EventType, SHPEEvent } from "../../../types/events";
import { clearCollection, createTestUserInFirebase, generateTestEvent, generateTestUsers } from "../../../helpers/unitTestUtils";

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
    await clearCollection("events")
});

describe("Create events", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    test("Handle empty events collection", async () => {
        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBe(0);

        const { events: pastEvents } = await getPastEvents(10, null);
        expect(pastEvents.length).toBe(0);
    });

    test("Create event with invalid data", async () => {
        const invalidEvent: Partial<SHPEEvent> = {
            name: "Invalid Event",
            description: "This event is has incorrect fields",
            startTimeBuffer: "600000" as any,
            endTimeBuffer: -600000,
            signInPoints: "three" as any,
            geolocation: { latitude: 30.621160236499136, longitude: -96.3403560168198 } as any
        };

        try {
            const eventId = await createEvent(invalidEvent as SHPEEvent);
            expect(eventId).toBeNull();
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});

describe("Various Fetch events", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    test("Fetch existing event", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const fetchedEvent = await getEvent(eventId!);
        expect(fetchedEvent).toBeDefined();
        expect(fetchedEvent).toMatchObject(event);
    })

    test("Fetch non-existent event", async () => {
        const nonExistentEventID = "nonExistentEventID";
        const fetchedEvent = await getEvent(nonExistentEventID);
        expect(fetchedEvent).toBeNull();
    });

    test("Fetch event with null ID", async () => {
        const nullEventID: any = null;
        const fetchedEvent = await getEvent(nullEventID);
        expect(fetchedEvent).toBeNull();
    });

    test("Fetch existing  event by name", async () => {
        const eventName = "Existing Event";
        const event = generateTestEvent({ name: eventName });
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const fetchedEvent = await fetchEventByName(eventName);
        expect(fetchedEvent).toBeDefined();
        expect(fetchedEvent).toMatchObject(event);

        await deleteDoc(doc(db, "events", eventId!));
    });

    test("Fetch non-existent event by name", async () => {
        const nonExistentEventName = "Non-existent Event";
        const fetchedEvent = await fetchEventByName(nonExistentEventName);
        expect(fetchedEvent).toBeNull();
    });

    test("Fetch upcoming events", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBeGreaterThan(0);

        const createdEvent = upcomingEvents.find(e => e.id === eventId);
        expect(createdEvent).toBeDefined();
        expect(createdEvent).toMatchObject(event);

        await deleteDoc(doc(db, "events", eventId!));
    });

    test("Fetch past events with limit", async () => {
        const event = generateTestEvent({
            startTime: Timestamp.fromDate(new Date(Date.now() - 7200 * 1000)),
            endTime: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000)),
            description: "Past Event Description",
            locationName: "Past Event Location",
            name: "Past Event",
        });

        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const { events: pastEvents } = await getPastEvents(1, null);
        expect(pastEvents.length).toBe(1);

        const fetchedEvent = pastEvents.find(e => e.id === eventId);
        expect(fetchedEvent).toBeDefined();
        expect(fetchedEvent).toMatchObject(event);

        await deleteDoc(doc(db, "events", eventId!));
    });

    test("Fetch past events without limit", async () => {
        const event = generateTestEvent({
            startTime: Timestamp.fromDate(new Date(Date.now() - 7200 * 1000)),
            endTime: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000)),
            description: "Past Event Description",
            locationName: "Past Event Location",
            name: "Past Event",
        });

        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const { events: pastEvents } = await getPastEvents(10, null);
        expect(pastEvents.length).toBeGreaterThan(0);

        const fetchedEvent = pastEvents.find(e => e.id === eventId);
        expect(fetchedEvent).toBeDefined();
        expect(fetchedEvent).toMatchObject(event);

        await deleteDoc(doc(db, "events", eventId!));
    });

    test("Multiple events and sorting", async () => {
        const event1 = generateTestEvent({
            startTime: Timestamp.fromDate(new Date(Date.now() + 3600 * 1000)),
            endTime: Timestamp.fromDate(new Date(Date.now() + 7200 * 1000)),
            description: "Event 1 Description",
            name: "Event 1",
            locationName: "Event 1 Location"
        });

        const event2 = generateTestEvent({
            startTime: Timestamp.fromDate(new Date(Date.now() + 10800 * 1000)),
            endTime: Timestamp.fromDate(new Date(Date.now() + 14400 * 1000)),
            description: "Event 2 Description",
            name: "Event 2",
            locationName: "Event 2 Location"
        });

        const event1Id = await createEvent(event1 as SHPEEvent);
        const event2Id = await createEvent(event2 as SHPEEvent);

        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBeGreaterThan(1);

        const event1Index = upcomingEvents.findIndex(e => e.id === event1Id);
        const event2Index = upcomingEvents.findIndex(e => e.id === event2Id);
        expect(event1Index).toBeLessThan(event2Index);

        await deleteDoc(doc(db, "events", event1Id!));
        await deleteDoc(doc(db, "events", event2Id!));
    });

    test("Events with different time frames", async () => {
        const pastEvent = generateTestEvent({
            startTime: Timestamp.fromDate(new Date(Date.now() - 7200 * 1000)),
            endTime: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000)),
            description: "Past Event",
            name: "Past Event",
            locationName: "Past Location"
        });

        const upcomingEvent = generateTestEvent({
            startTime: Timestamp.fromDate(new Date()),
            endTime: Timestamp.fromDate(new Date(Date.now() + 3600 * 1000)),
            description: "Upcoming Event",
            name: "Upcoming Event",
            locationName: "Upcoming Location"
        });

        const pastEventId = await createEvent(pastEvent as SHPEEvent);
        const upcomingEventId = await createEvent(upcomingEvent as SHPEEvent);

        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBeGreaterThan(0);
        expect(upcomingEvents.find(e => e.id === upcomingEventId)).toBeDefined();
        expect(upcomingEvents.find(e => e.id === pastEventId)).toBeUndefined();

        const { events: pastEvents } = await getPastEvents(10, null);
        expect(pastEvents.length).toBeGreaterThan(0);
        expect(pastEvents.find(e => e.id === pastEventId)).toBeDefined();
        expect(pastEvents.find(e => e.id === upcomingEventId)).toBeUndefined();

        await deleteDoc(doc(db, "events", pastEventId!));
        await deleteDoc(doc(db, "events", upcomingEventId!));
    });

    test("Handle large number of events", async () => {
        const currentTime = new Date();
        const eventsToCreate: SHPEEvent[] = [];

        for (let i = 0; i < 30; i++) {
            const event = generateTestEvent({
                description: `Event ${i}`,
                endTime: Timestamp.fromDate(new Date(currentTime.getTime() + (i + 1) * 3600 * 1000)),
                locationName: `Location ${i}`,
                name: `Event ${i}`,
                startTime: Timestamp.fromDate(new Date(currentTime.getTime() + i * 3600 * 1000)),
            });
            eventsToCreate.push(event);
        }

        const eventIds = await Promise.all(eventsToCreate.map(event => createEvent(event as SHPEEvent)));
        expect(eventIds).toHaveLength(30);

        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBeGreaterThanOrEqual(30);

        await Promise.all(eventIds.map(eventId => deleteDoc(doc(db, "events", eventId!))));
    });
});

describe("Update Events", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    test("Update an existing event with valid data", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const updatedEvent = { ...event, name: "Updated Event Name" };
        const result = await setEvent(eventId!, updatedEvent);

        expect(result).toBe(eventId);

        const updatedDoc = await getDoc(doc(db, "events", eventId!));
        expect(updatedDoc.exists()).toBe(true);
        expect(updatedDoc.data()?.name).toBe("Updated Event Name");

        await deleteDoc(doc(db, "events", eventId!));
    });

    test("Handle non-existent event ID", async () => {
        const nonExistentId = "non-existent-id";
        const event = generateTestEvent();

        const result = await setEvent(nonExistentId, event);

        expect(result).toBeNull();
    });

    test("Update an event with missing fields", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const updatedEvent = { ...event };
        delete updatedEvent.geofencingRadius;
        const result = await setEvent(eventId!, updatedEvent);

        expect(result).toBe(eventId);

        const updatedDoc = await getDoc(doc(db, "events", eventId!));
        expect(updatedDoc.exists()).toBe(true);
        expect(updatedDoc.data()?.name).toBe(event.name);

        await deleteDoc(doc(db, "events", eventId!));
    });

    test("Update an multiple fields of an event", async () => {
        const event = generateTestEvent({ locationName: "Initial Location", geolocation: new GeoPoint(30.621, -96.340) });
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const nestedUpdate = { locationName: "Updated Location", geolocation: new GeoPoint(30.622, -96.341) };
        const result = await setEvent(eventId!, nestedUpdate as SHPEEvent);

        expect(result).toBe(eventId);

        const updatedDoc = await getDoc(doc(db, "events", eventId!));
        expect(updatedDoc.exists()).toBe(true);
        expect(updatedDoc.data()?.locationName).toBe("Updated Location");
        expect(updatedDoc.data()?.geolocation.latitude).toBe(30.622);
        expect(updatedDoc.data()?.geolocation.longitude).toBe(-96.341);

        await deleteDoc(doc(db, "events", eventId!));
    });
});


describe("Destroy Event Function", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events");
    });

    test("Delete an existing event", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const result = await destroyEvent(eventId!);
        expect(result).toBe(true);

        const deletedEvent = await getDoc(doc(db, "events", eventId!));
        expect(deletedEvent.exists()).toBe(false);
    });

    test("Handle non-existent event ID", async () => {
        const nonExistentEventID = "nonExistentEventID";
        const result = await destroyEvent(nonExistentEventID);
        expect(result).toBe(false);
    });

    test("Delete event and its logs", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const logRef = doc(db, `events/${eventId}/logs`, "log1");
        await setDoc(logRef, { log: "sample log" });

        const result = await destroyEvent(eventId!);
        expect(result).toBe(true);

        const deletedLog = await getDoc(logRef);
        expect(deletedLog.exists()).toBe(false);
    });

    // test("Delete event and related user event logs", async () => {
    //     const event = generateTestEvent();
    //     const eventId = await createEvent(event as SHPEEvent);
    //     expect(eventId).not.toBeNull();

    //     const userRef = doc(db, "users", "user1");
    //     await setDoc(userRef, { name: "User 1" });

    //     const userEventLogRef = doc(db, `users/user1/event-logs`, eventId!);
    //     await setDoc(userEventLogRef, { log: "user event log" });

    //     const result = await destroyEvent(eventId!);
    //     expect(result).toBe(true);

    //     const deletedUserEventLog = await getDoc(userEventLogRef);
    //     expect(deletedUserEventLog.exists()).toBe(false);
    // });
});

describe("Event Attendance and Logs", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    test("Get attendance numbers for an event", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const logRef1 = doc(db, `events/${eventId}/logs`, "user1");
        await setDoc(logRef1, { signInTime: Timestamp.fromDate(new Date()), signOutTime: Timestamp.fromDate(new Date()) });

        const logRef2 = doc(db, `events/${eventId}/logs`, "user2");
        await setDoc(logRef2, { signInTime: Timestamp.fromDate(new Date()) });

        const attendance = await getAttendanceNumber(eventId!);
        expect(attendance.signedInCount).toBe(2);
        expect(attendance.signedOutCount).toBe(1);

        await destroyEvent(eventId!);
    });

    test("Get attendance numbers for an event with no logs", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const attendance = await getAttendanceNumber(eventId!);
        expect(attendance.signedInCount).toBe(0);
        expect(attendance.signedOutCount).toBe(0);

        await destroyEvent(eventId!);
    });

    test("Get user event log for an existing event and user", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const userLog = { signInTime: Timestamp.fromDate(new Date()), signOutTime: Timestamp.fromDate(new Date()) };
        const logRef = doc(db, `events/${eventId}/logs`, "user1");
        await setDoc(logRef, userLog);

        const fetchedLog = await getUserEventLog(eventId!, "user1");
        expect(fetchedLog).toMatchObject(userLog);

        await destroyEvent(eventId!);
    });

    test("Get user event log for a non-existent event", async () => {
        const nonExistentEventID = "nonExistentEventID";
        const fetchedLog = await getUserEventLog(nonExistentEventID, "user1");
        expect(fetchedLog).toBeNull();
    });

    test("Get user event log for a non-existent user", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const fetchedLog = await getUserEventLog(eventId!, "nonExistentUser");
        expect(fetchedLog).toBeNull();

        await destroyEvent(eventId!);
    });
});

describe("getMyEvents", () => {
    const COMMITTEE_1 = "committee1";
    const COMMITTEE_2 = "committee2";
    const INTEREST_1 = EventType.INTRAMURAL_EVENT;
    const INTEREST_2 = EventType.GENERAL_MEETING;

    beforeAll(async () => {
        await clearCollection("events");

        // Generate test events
        const event1 = generateTestEvent({ committee: COMMITTEE_1, eventType: INTEREST_1 });
        const event2 = generateTestEvent({ committee: COMMITTEE_1, eventType: INTEREST_2 });
        const event3 = generateTestEvent({ committee: COMMITTEE_2, eventType: INTEREST_1 });
        const event4 = generateTestEvent({ committee: COMMITTEE_2, eventType: INTEREST_2 });

        await setDoc(doc(db, "events", "event1"), event1);
        await setDoc(doc(db, "events", "event2"), event2);
        await setDoc(doc(db, "events", "event3"), event3);
        await setDoc(doc(db, "events", "event4"), event4);
    });

    test("returns events matching committees and interests", async () => {
        const events = await getMyEvents([COMMITTEE_1], [INTEREST_1]);
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBe(3);

        const eventNames = events.map(event => event.name);
        expect(eventNames).toContain("Test Event");
    });

    test("limits the number of events returned", async () => {
        const events = await getMyEvents([COMMITTEE_1, COMMITTEE_2], [INTEREST_1, INTEREST_2], 2);
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBe(2);
    });

    test("returns an empty array if no matching events", async () => {
        const events = await getMyEvents(["nonexistentCommittee"], ["nonexistentInterest"]);
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBe(0);
    });
});

describe("Fetch user event logs with pagination", () => {
    const testUsers = ["TestUser1", "TestUser2", "TestUser3", "NoEventUser"];

    const clearCollectionUserLog = async (collectionPath: string) => {
        const collectionRef = collection(db, collectionPath);
        const q = query(collectionRef);
        const snapshot = await getDocs(q);

        for (const docSnapshot of snapshot.docs) {
            const subCollectionPaths = (await getDocs(query(collection(docSnapshot.ref, 'event-logs')))).docs.map(doc => doc.ref.path);
            for (const subCollectionPath of subCollectionPaths) {
                await clearCollectionUserLog(subCollectionPath);
            }
            await deleteDoc(docSnapshot.ref);
        }
    };

    beforeAll(async () => {
        for (const user of testUsers) {
            await clearCollectionUserLog(`users/${user}/event-logs`);
        }
    });

    afterAll(async () => {
        for (const user of testUsers) {
            await clearCollectionUserLog(`users/${user}/event-logs`);
        }
    });
    test("Fetch user event logs with limit", async () => {
        const TESTUSER1 = "TestUser1";

        for (let i = 0; i < 5; i++) {
            const event = generateTestEvent();
            const eventId = await createEvent(event as SHPEEvent);
            await setDoc(doc(db, `users/${TESTUSER1}/event-logs`, eventId!), {
                signInTime: Timestamp.fromDate(new Date(Date.now() - (i + 1) * 3600 * 1000)),
                verified: true,
                points: 10
            });
        }
        const { events, lastVisibleDoc } = await getUserEventLogs(TESTUSER1, 3);
        expect(events.length).toBe(3);
        expect(lastVisibleDoc).not.toBeNull();
    });

    test("Fetch next page of user event logs", async () => {
        const TESTUSER2 = "TestUser2";
        for (let i = 0; i < 5; i++) {
            const event = generateTestEvent();
            const eventId = await createEvent(event as SHPEEvent);
            await setDoc(doc(db, `users/${TESTUSER2}/event-logs`, eventId!), {
                signInTime: Timestamp.fromDate(new Date(Date.now() - (i + 1) * 3600 * 1000)),
                verified: true,
                points: 10
            });
        }

        // Fetch first page
        const { events: firstPageEvents, lastVisibleDoc: firstPageLastVisible } = await getUserEventLogs(TESTUSER2, 3);
        expect(firstPageEvents.length).toBe(3);
        expect(firstPageLastVisible).not.toBeNull();

        // Fetch second page
        const { events: secondPageEvents, lastVisibleDoc: secondPageLastVisible } = await getUserEventLogs(TESTUSER2, 3, firstPageLastVisible);
        expect(secondPageEvents.length).toBe(2);
        expect(secondPageLastVisible).not.toBeNull();
    });

    test("Set end of data flag correctly", async () => {
        const TESTUSER3 = "TestUser3";

        for (let i = 0; i < 5; i++) {
            const event = generateTestEvent();
            const eventId = await createEvent(event as SHPEEvent);
            await setDoc(doc(db, `users/${TESTUSER3}/event-logs`, eventId!), {
                signInTime: Timestamp.fromDate(new Date(Date.now() - (i + 1) * 3600 * 1000)),
                verified: true,
                points: 10
            });
        }

        let endOfData = false;

        const { events, lastVisibleDoc } = await getUserEventLogs(TESTUSER3, 10, null, (end) => endOfData = end);
        expect(events.length).toBe(5);
        expect(lastVisibleDoc).not.toBeNull();
        expect(endOfData).toBe(true);
    });

    test("Handle user with no event logs", async () => {
        const NOEVENTUSER = "NoEventUser";
        const noEventUser = await generateTestUsers({ publicInfo: { uid: NOEVENTUSER } });
        await createTestUserInFirebase(noEventUser);

        const { events, lastVisibleDoc } = await getUserEventLogs(NOEVENTUSER, 3);
        expect(events.length).toBe(0);
        expect(lastVisibleDoc).toBeNull(); // No documents, should be null
    });
});

