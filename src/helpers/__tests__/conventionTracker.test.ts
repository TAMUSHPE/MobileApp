import { Timestamp } from 'firebase/firestore';
import { EventType, SHPEEventLog } from '../../types/events';
import {
    REQUIRED_COUNT,
    ConventionEventInfo,
    deriveConventionAttendance,
    deriveConventionCounts,
    isConventionEligible,
    buildMemberConventionProgress,
    formatConventionDatePill,
} from '../conventionTracker';

const ts = (iso: string) => Timestamp.fromDate(new Date(iso));

const eventMap = (
    entries: Array<[string, Partial<ConventionEventInfo> & { eventType: string }]>
): Map<string, ConventionEventInfo> =>
    new Map(
        entries.map(([id, info]) => [
            id,
            {
                eventType: info.eventType,
                name: info.name ?? null,
                startTime: info.startTime ?? null,
            },
        ])
    );

describe('deriveConventionAttendance', () => {
    test('counts volunteer on sign-in alone', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 'v1', signInTime: ts('2026-01-10T18:00:00Z') },
        ];
        const events = eventMap([
            ['v1', { eventType: EventType.VOLUNTEER_EVENT, name: 'Park Cleanup', startTime: ts('2026-01-10T18:00:00Z') }],
        ]);

        const attendance = deriveConventionAttendance(logs, events);

        expect(attendance.volunteer).toHaveLength(1);
        expect(attendance.volunteer[0].name).toBe('Park Cleanup');
        expect(attendance.workshop).toHaveLength(0);
        expect(attendance.generalMeeting).toHaveLength(0);
    });

    test('requires sign-out for workshop and general meeting', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 'w1', signInTime: ts('2026-02-01T18:00:00Z') },
            {
                eventId: 'w2',
                signInTime: ts('2026-02-08T18:00:00Z'),
                signOutTime: ts('2026-02-08T19:00:00Z'),
            },
            { eventId: 'g1', signInTime: ts('2026-02-15T18:00:00Z') },
            {
                eventId: 'g2',
                signInTime: ts('2026-02-22T18:00:00Z'),
                signOutTime: ts('2026-02-22T19:00:00Z'),
            },
        ];
        const events = eventMap([
            ['w1', { eventType: EventType.WORKSHOP, name: 'Resume', startTime: ts('2026-02-01T18:00:00Z') }],
            ['w2', { eventType: EventType.WORKSHOP, name: 'Interview', startTime: ts('2026-02-08T18:00:00Z') }],
            ['g1', { eventType: EventType.GENERAL_MEETING, name: 'GM 1', startTime: ts('2026-02-15T18:00:00Z') }],
            ['g2', { eventType: EventType.GENERAL_MEETING, name: 'GM 2', startTime: ts('2026-02-22T18:00:00Z') }],
        ]);

        const attendance = deriveConventionAttendance(logs, events);

        expect(attendance.workshop.map((e) => e.eventId)).toEqual(['w2']);
        expect(attendance.generalMeeting.map((e) => e.eventId)).toEqual(['g2']);
    });

    test('ignores unrelated event types and logs without sign-in', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 's1', signInTime: ts('2026-03-01T18:00:00Z'), signOutTime: ts('2026-03-01T19:00:00Z') },
            { eventId: 'v1' },
        ];
        const events = eventMap([
            ['s1', { eventType: EventType.SOCIAL_EVENT, name: 'Social' }],
            ['v1', { eventType: EventType.VOLUNTEER_EVENT, name: 'Volunteer' }],
        ]);

        const attendance = deriveConventionAttendance(logs, events);

        expect(attendance.volunteer).toHaveLength(0);
        expect(attendance.workshop).toHaveLength(0);
        expect(attendance.generalMeeting).toHaveLength(0);
    });

    test('sorts each category by startTime ascending with unknown last', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 'v-late', signInTime: ts('2026-04-20T18:00:00Z') },
            { eventId: 'v-early', signInTime: ts('2026-04-01T18:00:00Z') },
            { eventId: 'v-unknown', signInTime: ts('2026-04-10T18:00:00Z') },
        ];
        const events = eventMap([
            ['v-late', { eventType: EventType.VOLUNTEER_EVENT, name: 'Late', startTime: ts('2026-04-20T18:00:00Z') }],
            ['v-early', { eventType: EventType.VOLUNTEER_EVENT, name: 'Early', startTime: ts('2026-04-01T18:00:00Z') }],
            ['v-unknown', { eventType: EventType.VOLUNTEER_EVENT, name: 'Unknown', startTime: null }],
        ]);

        const attendance = deriveConventionAttendance(logs, events);

        expect(attendance.volunteer.map((e) => e.eventId)).toEqual(['v-early', 'v-late', 'v-unknown']);
    });
});

describe('deriveConventionCounts and isConventionEligible', () => {
    test('counts are lengths of attendance buckets', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 'v1', signInTime: ts('2026-01-01T18:00:00Z') },
            { eventId: 'v2', signInTime: ts('2026-01-08T18:00:00Z') },
            {
                eventId: 'w1',
                signInTime: ts('2026-01-15T18:00:00Z'),
                signOutTime: ts('2026-01-15T19:00:00Z'),
            },
        ];
        const events = eventMap([
            ['v1', { eventType: EventType.VOLUNTEER_EVENT, startTime: ts('2026-01-01T18:00:00Z') }],
            ['v2', { eventType: EventType.VOLUNTEER_EVENT, startTime: ts('2026-01-08T18:00:00Z') }],
            ['w1', { eventType: EventType.WORKSHOP, startTime: ts('2026-01-15T18:00:00Z') }],
        ]);

        expect(deriveConventionCounts(logs, events)).toEqual({
            volunteer: 2,
            workshop: 1,
            generalMeeting: 0,
        });
        expect(isConventionEligible(deriveConventionCounts(logs, events))).toBe(false);
    });

    test('eligible only when every category meets REQUIRED_COUNT', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 'v1', signInTime: ts('2026-01-01T18:00:00Z') },
            { eventId: 'v2', signInTime: ts('2026-01-08T18:00:00Z') },
            {
                eventId: 'w1',
                signInTime: ts('2026-01-15T18:00:00Z'),
                signOutTime: ts('2026-01-15T19:00:00Z'),
            },
            {
                eventId: 'w2',
                signInTime: ts('2026-01-22T18:00:00Z'),
                signOutTime: ts('2026-01-22T19:00:00Z'),
            },
            {
                eventId: 'g1',
                signInTime: ts('2026-02-01T18:00:00Z'),
                signOutTime: ts('2026-02-01T19:00:00Z'),
            },
            {
                eventId: 'g2',
                signInTime: ts('2026-02-08T18:00:00Z'),
                signOutTime: ts('2026-02-08T19:00:00Z'),
            },
        ];
        const events = eventMap([
            ['v1', { eventType: EventType.VOLUNTEER_EVENT, startTime: ts('2026-01-01T18:00:00Z') }],
            ['v2', { eventType: EventType.VOLUNTEER_EVENT, startTime: ts('2026-01-08T18:00:00Z') }],
            ['w1', { eventType: EventType.WORKSHOP, startTime: ts('2026-01-15T18:00:00Z') }],
            ['w2', { eventType: EventType.WORKSHOP, startTime: ts('2026-01-22T18:00:00Z') }],
            ['g1', { eventType: EventType.GENERAL_MEETING, startTime: ts('2026-02-01T18:00:00Z') }],
            ['g2', { eventType: EventType.GENERAL_MEETING, startTime: ts('2026-02-08T18:00:00Z') }],
        ]);

        const counts = deriveConventionCounts(logs, events);
        expect(counts).toEqual({ volunteer: 2, workshop: 2, generalMeeting: 2 });
        expect(isConventionEligible(counts)).toBe(true);
        expect(REQUIRED_COUNT).toBe(2);
    });
});

describe('buildMemberConventionProgress', () => {
    test('clamps display to first REQUIRED_COUNT events and caps overall met at 6', () => {
        const logs: SHPEEventLog[] = [
            { eventId: 'v1', signInTime: ts('2026-01-01T18:00:00Z') },
            { eventId: 'v2', signInTime: ts('2026-01-08T18:00:00Z') },
            { eventId: 'v3', signInTime: ts('2026-01-15T18:00:00Z') },
            {
                eventId: 'w1',
                signInTime: ts('2026-02-01T18:00:00Z'),
                signOutTime: ts('2026-02-01T19:00:00Z'),
            },
        ];
        const events = eventMap([
            ['v1', { eventType: EventType.VOLUNTEER_EVENT, name: 'V1', startTime: ts('2026-01-01T18:00:00Z') }],
            ['v2', { eventType: EventType.VOLUNTEER_EVENT, name: 'V2', startTime: ts('2026-01-08T18:00:00Z') }],
            ['v3', { eventType: EventType.VOLUNTEER_EVENT, name: 'V3', startTime: ts('2026-01-15T18:00:00Z') }],
            ['w1', { eventType: EventType.WORKSHOP, name: 'W1', startTime: ts('2026-02-01T18:00:00Z') }],
        ]);

        const progress = buildMemberConventionProgress({
            selected: true,
            logs,
            eventById: events,
        });

        const volunteering = progress.categories.find((c) => c.key === 'volunteer')!;
        expect(volunteering.count).toBe(2);
        expect(volunteering.complete).toBe(true);
        expect(volunteering.remainingSlots).toBe(0);
        expect(volunteering.events.map((e) => e.eventId)).toEqual(['v1', 'v2']);

        const workshops = progress.categories.find((c) => c.key === 'workshop')!;
        expect(workshops.count).toBe(1);
        expect(workshops.remainingSlots).toBe(1);
        expect(workshops.complete).toBe(false);

        expect(progress.met).toBe(3);
        expect(progress.total).toBe(6);
        expect(progress.eligible).toBe(false);
        expect(progress.selected).toBe(true);
    });

    test('returns not selected progress when gate fails', () => {
        const progress = buildMemberConventionProgress({
            selected: false,
            logs: [],
            eventById: new Map(),
        });

        expect(progress.selected).toBe(false);
        expect(progress.met).toBe(0);
        expect(progress.eligible).toBe(false);
        expect(progress.categories.every((c) => c.count === 0 && c.remainingSlots === 2)).toBe(true);
    });
});

describe('formatConventionDatePill', () => {
    test('formats with ordinal suffix', () => {
        expect(formatConventionDatePill(ts('2026-08-07T12:00:00Z'))).toMatch(/Aug \d+(st|nd|rd|th)/);
        expect(formatConventionDatePill(null)).toBe('');
    });
});
