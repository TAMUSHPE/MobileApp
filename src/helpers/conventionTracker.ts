import { Timestamp } from 'firebase/firestore';
import { EventType, SHPEEventLog } from '../types/events';
import { monthNames } from './timeUtils';

/** Number of qualifying attendances required per category for eligibility. */
export const REQUIRED_COUNT = 2;

export interface ConventionCounts {
    volunteer: number;
    workshop: number;
    generalMeeting: number;
}

/** The slice of an event the tracker needs to attribute an attendance. */
export interface ConventionEventInfo {
    eventType: string;
    name: string | null;
    startTime: Timestamp | null;
    nationalConventionEligible: boolean;
}

/** One qualifying attendance: the event behind a unit of a category count. */
export interface ConventionAttendedEvent {
    eventId: string;
    name: string | null;
    startTime: Timestamp | null;
}

export interface ConventionAttendance {
    volunteer: ConventionAttendedEvent[];
    workshop: ConventionAttendedEvent[];
    generalMeeting: ConventionAttendedEvent[];
}

export type ConventionCategoryKey = keyof ConventionCounts;

export interface CategoryProgress {
    key: ConventionCategoryKey;
    label: string;
    events: ConventionAttendedEvent[];
    count: number;
    required: typeof REQUIRED_COUNT;
    complete: boolean;
    remainingSlots: number;
}

export interface MemberConventionProgress {
    selected: boolean;
    dateAdded?: Timestamp;
    categories: CategoryProgress[];
    met: number;
    total: 6;
    eligible: boolean;
}

/**
 * Maps an event's `eventType` to the `ConventionCounts` bucket it counts
 * toward. Event types not listed here don't count toward convention eligibility.
 */
const CATEGORY_BY_EVENT_TYPE: Record<string, ConventionCategoryKey> = {
    [EventType.VOLUNTEER_EVENT]: 'volunteer',
    [EventType.WORKSHOP]: 'workshop',
    [EventType.GENERAL_MEETING]: 'generalMeeting',
};

const CATEGORY_LABELS: Record<ConventionCategoryKey, string> = {
    volunteer: 'Volunteering',
    workshop: 'Workshops',
    generalMeeting: 'General Meetings',
};

const CATEGORY_ORDER: ConventionCategoryKey[] = ['volunteer', 'workshop', 'generalMeeting'];

/**
 * Buckets a member's `event-logs` into the qualifying events behind each
 * convention-attendance category.
 *
 * Only events explicitly marked `nationalConventionEligible` are counted.
 * Attendance gate by category:
 *  - Volunteer Event: `signInTime` alone is enough
 *  - Workshop / General Meeting: BOTH `signInTime` AND `signOutTime`
 *
 * Within each category, events are sorted by `startTime` ascending
 * (unknown start times last).
 */
export function deriveConventionAttendance(
    logs: SHPEEventLog[],
    eventById: Map<string, ConventionEventInfo>
): ConventionAttendance {
    const attendance: ConventionAttendance = {
        volunteer: [],
        workshop: [],
        generalMeeting: [],
    };

    for (const log of logs) {
        if (!log.signInTime) {
            continue;
        }

        const eventId = log.eventId ?? '';
        const event = eventById.get(eventId);
        const category = event ? CATEGORY_BY_EVENT_TYPE[event.eventType] : undefined;
        if (!event?.nationalConventionEligible || !category) {
            continue;
        }

        if (category !== 'volunteer' && !log.signOutTime) {
            continue;
        }

        attendance[category].push({
            eventId,
            name: event.name,
            startTime: event.startTime,
        });
    }

    const byStartTime = (a: ConventionAttendedEvent, b: ConventionAttendedEvent) => {
        if (!a.startTime) return b.startTime ? 1 : 0;
        if (!b.startTime) return -1;
        return a.startTime.toMillis() - b.startTime.toMillis();
    };
    attendance.volunteer.sort(byStartTime);
    attendance.workshop.sort(byStartTime);
    attendance.generalMeeting.sort(byStartTime);

    return attendance;
}

/**
 * Per-category convention-attendance counts — lengths of
 * `deriveConventionAttendance`'s buckets.
 */
export function deriveConventionCounts(
    logs: SHPEEventLog[],
    eventById: Map<string, ConventionEventInfo>
): ConventionCounts {
    const attendance = deriveConventionAttendance(logs, eventById);
    return {
        volunteer: attendance.volunteer.length,
        workshop: attendance.workshop.length,
        generalMeeting: attendance.generalMeeting.length,
    };
}

/** A member is convention-eligible once every category meets `REQUIRED_COUNT`. */
export function isConventionEligible(counts: ConventionCounts): boolean {
    return (
        counts.volunteer >= REQUIRED_COUNT &&
        counts.workshop >= REQUIRED_COUNT &&
        counts.generalMeeting >= REQUIRED_COUNT
    );
}

/**
 * Member-facing view model: clamps each category display to the earliest
 * `REQUIRED_COUNT` events and caps overall progress at 6 slots.
 */
export function buildMemberConventionProgress(params: {
    selected: boolean;
    dateAdded?: Timestamp;
    logs: SHPEEventLog[];
    eventById: Map<string, ConventionEventInfo>;
}): MemberConventionProgress {
    const { selected, dateAdded, logs, eventById } = params;

    if (!selected) {
        return {
            selected: false,
            dateAdded,
            categories: CATEGORY_ORDER.map((key) => ({
                key,
                label: CATEGORY_LABELS[key],
                events: [],
                count: 0,
                required: REQUIRED_COUNT,
                complete: false,
                remainingSlots: REQUIRED_COUNT,
            })),
            met: 0,
            total: 6,
            eligible: false,
        };
    }

    const attendance = deriveConventionAttendance(logs, eventById);
    const rawCounts = deriveConventionCounts(logs, eventById);

    const categories: CategoryProgress[] = CATEGORY_ORDER.map((key) => {
        const attended = attendance[key];
        const displayEvents = attended.slice(0, REQUIRED_COUNT);
        const count = Math.min(attended.length, REQUIRED_COUNT);
        return {
            key,
            label: CATEGORY_LABELS[key],
            events: displayEvents,
            count,
            required: REQUIRED_COUNT,
            complete: count >= REQUIRED_COUNT,
            remainingSlots: Math.max(0, REQUIRED_COUNT - count),
        };
    });

    const met =
        Math.min(rawCounts.volunteer, REQUIRED_COUNT) +
        Math.min(rawCounts.workshop, REQUIRED_COUNT) +
        Math.min(rawCounts.generalMeeting, REQUIRED_COUNT);

    return {
        selected: true,
        dateAdded,
        categories,
        met,
        total: 6,
        eligible: isConventionEligible(rawCounts),
    };
}

/** Date pill label matching the reference (e.g. "Aug 7th"). */
export function formatConventionDatePill(startTime: Timestamp | null | undefined): string {
    if (!startTime) {
        return '';
    }
    const date = startTime.toDate();
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}${ordinalSuffix(day)}`;
}

function ordinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
