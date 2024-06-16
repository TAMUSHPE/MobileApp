import { Timestamp, GeoPoint, deleteDoc, doc, collection, getDocs } from "firebase/firestore";
import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebaseConfig";
import { createEvent, getUpcomingEvents, getPastEvents } from "../../../api/firebaseUtils";
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

    // Clear events collection
    const eventsRef = collection(db, "events");
    const eventsSnapshot = await getDocs(eventsRef);
    for (const doc of eventsSnapshot.docs) {
        await deleteDoc(doc.ref);
    }
});

afterAll(async () => {
    await signOut(auth);
});

describe("Event Utils", () => {
    test("Handle empty events collection", async () => {
        const upcomingEvents = await getUpcomingEvents();
        expect(upcomingEvents.length).toBe(0);

        const pastEvents = await getPastEvents();
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

    test("Create and fetch upcoming events", async () => {
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

        const pastEvents = await getPastEvents(1);
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

        const pastEvents = await getPastEvents();
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

        const pastEvents = await getPastEvents();
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