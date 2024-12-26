import dotenv from 'dotenv';
dotenv.config();

import { signInAnonymously, signOut } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { User } from "../../types/user";
import { deleteDoc, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { createEvent, destroyEvent, fetchEventByName, getEvent, getPastEvents, getUpcomingEvents, getWeekPastEvents, setEvent } from '../firebaseUtils';
import { SHPEEvent } from '../../types/events';

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
        // Create a test user with an event log
        await setDoc(doc(db, 'users', 'testUser'), { name: 'Test User' });
        await setDoc(doc(db, 'users/testUser/event-logs', 'event1'), { attended: true });

        const result = await destroyEvent('event1');
        expect(result).toBe(true);

        const deletedEvent = await getEvent('event1');
        expect(deletedEvent).toBeNull();

        const userEventLog = await getDoc(doc(db, 'users/testUser/event-logs', 'event1'));
        expect(userEventLog.exists()).toBe(false);

        // Clean up
        await deleteDoc(doc(db, 'users', 'testUser'));
    });
});
