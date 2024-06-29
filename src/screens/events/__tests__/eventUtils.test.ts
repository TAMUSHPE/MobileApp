import { Timestamp, GeoPoint, deleteDoc, doc, collection, getDocs, getDoc, setDoc, DocumentReference, writeBatch } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { createEvent, getUpcomingEvents, getPastEvents, setEvent, getEvent, destroyEvent, getAttendanceNumber, getUserEventLog, fetchEventByName } from "../../../api/firebaseUtils";
import { EventType, SHPEEvent } from "../../../types/events";

const generateTestEvent = (overrides: Partial<SHPEEvent> = {}): SHPEEvent => {
    const currentTime = new Date();
    const startTime = Timestamp.fromDate(currentTime);
    const endTime = Timestamp.fromDate(new Date(currentTime.getTime() + 3600 * 1000));

    return {
        committee: "app-devs",
        coverImageURI: null,
        creator: "sampleUID",
        description: "Test Description",
        endTime: endTime,
        endTimeBuffer: 600000,
        eventType: EventType.INTRAMURAL_EVENT,
        general: true,
        geofencingRadius: 100,
        geolocation: new GeoPoint(30.621160236499136, -96.3403560168198),
        hiddenEvent: false,
        locationName: "Test",
        name: "Test Event",
        nationalConventionEligible: true,
        notificationSent: true,
        signInPoints: 3,
        startTime: startTime,
        startTimeBuffer: 600000,
        ...overrides
    };
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
    await clearCollection("events")
});

describe("Create events", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    afterAll(async () => {
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

    afterAll(async () => {
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

        for (let i = 0; i < 100; i++) {
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
        expect(eventIds).toHaveLength(100);

        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBeGreaterThanOrEqual(100);

        await Promise.all(eventIds.map(eventId => deleteDoc(doc(db, "events", eventId!))));
    });
});

describe("Update Events", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    afterAll(async () => {
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
        await clearCollection("events")
    });

    afterAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
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

    test("Delete event and related user event logs", async () => {
        const event = generateTestEvent();
        const eventId = await createEvent(event as SHPEEvent);
        expect(eventId).not.toBeNull();

        const userRef = doc(db, "users", "user1");
        await setDoc(userRef, { name: "User 1" });

        const userEventLogRef = doc(db, `users/user1/event-logs`, eventId!);
        await setDoc(userEventLogRef, { log: "user event log" });

        const result = await destroyEvent(eventId!);
        expect(result).toBe(true);

        const deletedUserEventLog = await getDoc(userEventLogRef);
        expect(deletedUserEventLog.exists()).toBe(false);
    });
});

describe("Event Attendance and Logs", () => {
    beforeAll(async () => {
        await clearCollection("users");
        await clearCollection("events")
    });

    afterAll(async () => {
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