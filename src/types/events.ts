import { GeoPoint, Timestamp } from 'firebase/firestore';
import { MillisecondTimes, getNextHourMillis } from '../helpers';

/** Anything added to this document needs to be added to functions/src/types/events.ts and to 
 *  shpe-app-web/app/types/events.ts
 *  **/

/**
 * Type used specifically for Workshop events to differentiate the type of workshop
 */
export type WorkshopType = "Professional" | "Academic" | "None";

/**
 * Generic Event Interface. All SHPE related events must implement or extend this type
 */
export abstract class SHPEEvent {
    /** Document name in firebase */
    public id?: string | null;
    /** Name of event to display to users. This does NOT uniquely identify the event. */
    public name?: string | null;
    /** User submitted description of event */
    public description?: string | null;
    /** Specifies type of event and implies which fields are possibly important to both front and back-end */
    public eventType?: EventType | null;
    /** Any extra data tags that are useful in analysis, but not app or point calculation functionality. */
    public tags?: string[] | null;
    /** Firebase timestamp of when the event starts */
    public startTime?: Timestamp | null;
    /** Firebase timestamp of when the event ends */
    public endTime?: Timestamp | null;
    /** Time in milliseconds before event starts when users can sign in/out */
    public startTimeBuffer?: number | null;
    /** Time in milliseconds after event ends when users can sign in/out */
    public endTimeBuffer?: number | null;
    /** URI for image that will be displayed for the event */
    public coverImageURI?: string | null;
    /** Points a user will receive when signing in */
    public signInPoints?: number | null;
    /** Points a user will receive when signing out */
    public signOutPoints?: number | null;
    /** Points a user will receive for each hour they are signed in */
    public pointsPerHour?: number | null;
    /** Text description of location */
    public locationName?: string | null;
    /** Real location of event */
    public geolocation?: GeoPoint | null;
    /** Allowed radius in meters for being able to sign into an event */
    public geofencingRadius?: number | null;
    /** Attribute used specifically for workshops */
    public workshopType?: WorkshopType;
    /** Specifies which committee this event is associated with */
    public committee?: string | null;
    /** Specifies who created this event */
    public creator?: string | null;
    /** Is the member eligible for national convention*/
    public nationalConventionEligible?: boolean | null;
    /** Specifies if event should display on "General" tab of ishpe, if it is club-wide */
    public general?: boolean | null;
    /** A flag to indicate that the notification has been sent */
    public notificationSent?: boolean | null;
    /** Hide event from Events Screen */
    public hiddenEvent?: boolean | null;


    /**
     * Instantiates all fields that exist on all SHPE Events
     */
    public constructor() {
        this.name = null;
        this.description = null;
        this.eventType = null;
        this.tags = null;
        this.startTime = null;
        this.endTime = null;
        this.coverImageURI = null;
        this.committee = null;
        this.general = false;
        this.geolocation = null;
        this.geofencingRadius = null;
        this.creator = null;
        this.nationalConventionEligible = null;
        this.notificationSent = true;
        this.endTimeBuffer = null;
        this.startTimeBuffer = null;
        this.hiddenEvent = false;
    }

    /**
     * Copies a given event's fields into the current object. 
     * This will only copy fields that are currently defined in this object.
     * @param event Event to copy
     */
    public copyFromObject?(event: SHPEEvent) {
        for (const [key, value] of Object.entries(event)) {
            if (this[key as keyof SHPEEvent] !== undefined && value !== undefined) {
                this[key as keyof SHPEEvent] = value;
            }
        }
    }
}

/**
 * Log which tracks an event sign in
 */
export interface SHPEEventLog {
    uid?: string;
    points?: number;
    eventId?: string; // Used when data is copied to user collection
    signInTime?: Timestamp;
    signOutTime?: Timestamp;
    creationTime?: Timestamp;
    verified?: boolean;
    instagramLogs?: Timestamp[]; // Used to log instagram points
}

/**
 * Template class for General Meeting event.
 */
export class GeneralMeeting extends SHPEEvent {
    public name: string | null;
    public description: string | null;
    public eventType: EventType | null;
    public tags: string[] | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public signOutPoints: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;
    public notificationSent: boolean | null;


    public constructor() {
        super();
        this.name = null;
        this.description = null;
        this.eventType = EventType.GENERAL_MEETING;
        this.tags = [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 0;
        this.signOutPoints = 0;
        this.locationName = null;
        this.geolocation = null;
        this.general = true;
        this.notificationSent = false;
    }


}

/**
 * Template class for Committee Meeting event 
 */
export class CommitteeMeeting extends SHPEEvent {
    public name: string | null;
    public tags: string[] | null;
    public description: string | null;
    public eventType: EventType | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Committee Meeting";
        this.tags = [];
        this.description = null;
        this.eventType = EventType.COMMITTEE_MEETING;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 1;
        this.locationName = null;
        this.geolocation = null;
        this.general = false
    }
}

/**
 * Template class for Study Hours event
 * 
 * Note: Study hours only give points if a user has signed both in and out
 */
export class StudyHours extends SHPEEvent {
    public name: string | null;
    public description: string | null;
    public eventType: EventType | null;
    public tags: string[] | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public signOutPoints: number | null;
    public pointsPerHour: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Study Hours";
        this.description = null;
        this.eventType = EventType.STUDY_HOURS;
        this.tags = [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR * 4);
        this.signInPoints = 0;
        this.signOutPoints = 0;
        this.pointsPerHour = 1;
        this.locationName = null;
        this.geolocation = null;
        this.general = true;
        this.notificationSent = true;
        this.startTimeBuffer = MillisecondTimes.MINUTE * 0;
        this.endTimeBuffer = MillisecondTimes.MINUTE * 15;
    }
}

/**
 * Template class for Workshop event
 * 
 * Workshops have a field unique to them which specify what type of workshop they are
 */
export class Workshop extends SHPEEvent {
    public name: string | null;
    public description: string | null;
    public tags: string[] | null;
    public eventType: EventType | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public workshopType: WorkshopType;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Workshop";
        this.description = null;
        this.tags = [];
        this.eventType = EventType.WORKSHOP;
        this.workshopType = "None";
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 3;
        this.locationName = null;
        this.geolocation = null;
        this.general = false
    }
}

/**
 * Template class for Volunteer event
 */
export class VolunteerEvent extends SHPEEvent {
    public name: string | null;
    public tags: string[] | null;
    public description: string | null;
    public eventType: EventType | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public pointsPerHour: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Volunteer Event";
        this.tags = [];
        this.description = null;
        this.eventType = EventType.VOLUNTEER_EVENT;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 0;
        this.signOutPoints = null;
        this.pointsPerHour = null;
        this.locationName = null;
        this.geolocation = null;
        this.general = false
    }
}

/**
 * Template class for Social event
 */
export class SocialEvent extends SHPEEvent {
    public name: string | null;
    public tags: string[] | null;
    public description: string | null;
    public eventType: EventType | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Social Event";
        this.tags = [];
        this.description = null;
        this.eventType = EventType.SOCIAL_EVENT;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 1;
        this.locationName = null;
        this.geolocation = null;
        this.general = false
    }
}

/**
 * Template class for Intramural event
 */
export class IntramuralEvent extends SHPEEvent {
    public name: string | null;
    public tags: string[] | null;
    public description: string | null;
    public eventType: EventType | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Intramural Event";
        this.tags = [];
        this.description = null;
        this.eventType = EventType.INTRAMURAL_EVENT;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 1;
        this.locationName = null;
        this.geolocation = null;
        this.general = false
    }
}

/**
 * Template class for a custom event. These events are purposefully generic for the creation of events that don't fit into another template.
 */
export class CustomEvent extends SHPEEvent {
    public name: string | null;
    public description: string | null;
    public eventType: EventType | null;
    public tags: string[] | null;
    public startTime: Timestamp | null;
    public endTime: Timestamp | null;
    public signInPoints: number | null;
    public signOutPoints: number | null;
    public pointsPerHour: number | null;
    public locationName: string | null;
    public geolocation: GeoPoint | null;
    public general: boolean;

    public constructor() {
        super();
        this.name = "Custom Event";
        this.description = null;
        this.eventType = EventType.CUSTOM_EVENT;
        this.tags = [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 0;
        this.signOutPoints = null;
        this.pointsPerHour = null;
        this.locationName = null;
        this.geolocation = null;
        this.general = false
    }
}

/**
 * String constants for event type. These are strings for readability
 */
export enum EventType {
    GENERAL_MEETING = "General Meeting",
    COMMITTEE_MEETING = "Committee Meeting",
    STUDY_HOURS = "Study Hours",
    WORKSHOP = "Workshop",
    VOLUNTEER_EVENT = "Volunteer Event",
    SOCIAL_EVENT = "Social Event",
    INTRAMURAL_EVENT = "Intramural Event",
    CUSTOM_EVENT = "Custom Event",
}

/**
 * Extended event type to include 'myEvents' and 'clubWide' for filtering
 */
export type ExtendedEventType = EventType | 'myEvents' | 'clubWide';

/**
 * Status of an event that user attempts to sign in to or out of
 */
export enum EventLogStatus {
    SUCCESS,
    EVENT_OVER,
    EVENT_ONGOING,
    EVENT_NOT_FOUND,
    ALREADY_LOGGED,
    NOT_A_STUDENT,
    EVENT_NOT_STARTED,
    OUT_OF_RANGE,
    ERROR,
    GEOLOCATION_NOT_FOUND,
}

export type UserEventData = {
    eventData?: SHPEEvent,
    eventLog?: SHPEEventLog,
}

export const getStatusMessage = (status: EventLogStatus, mode?: "sign-in" | "sign-out"): string => {
    const statusMessages = {
        [EventLogStatus.SUCCESS]: `Successfully ${mode === `sign-in` ? `signed in` : `signed out`}.`,
        [EventLogStatus.EVENT_OVER]: `The event is already over.`,
        [EventLogStatus.EVENT_ONGOING]: `The event is ongoing.`,
        [EventLogStatus.EVENT_NOT_FOUND]: `The event was not found.`,
        [EventLogStatus.ALREADY_LOGGED]: `You have already ${mode === `sign-in` ? `signed in` : `signed out`}.`,
        [EventLogStatus.NOT_A_STUDENT]: `Only students can ${mode === `sign-in` ? `sign in` : `sign out`} of events.`,
        [EventLogStatus.EVENT_NOT_STARTED]: `The event has not started yet.`,
        [EventLogStatus.OUT_OF_RANGE]: `You are not close enough to the event to ${mode === `sign-in` ? `sign in` : `sign out`}.`,
        [EventLogStatus.ERROR]: `An internal error occurred. Please try again.`,
        [EventLogStatus.GEOLOCATION_NOT_FOUND]: "Your location could not be verified. Please try enabling location services and try again.",
    };

    return statusMessages[status] || "An unknown error occurred.";
};



