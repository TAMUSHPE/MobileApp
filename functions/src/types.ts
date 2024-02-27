export type RankChange = "decreased" | "same" | "increased";
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';

/**
 * Type used specifically for Workshop events to differentiate the type of workshop
 */
export type WorkshopType = "Professional" | "Academic" | "None";

/**
 * Generic Event Interface. All events must implement this type
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
    public nationalConventionEligible?: boolean | null;

    /**
     * Instantiates all fields that are required for all SHPE Events
     */
    public constructor() {
        this.name = null;
        this.description = null;
        this.eventType = null;
        this.tags = null;
        this.startTime = null;
        this.endTime = null;
        this.coverImageURI = null;
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
    creationTime?: Timestamp
    verified?: boolean;
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
