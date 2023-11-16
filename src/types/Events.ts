import { Timestamp } from 'firebase/firestore';
import { MillisecondTimes } from '../helpers';

export interface SHPEEvent {
    id?: string;
    name: string;
    description: string;
    eventType: string;
    tags: string[];
    startTime: Timestamp;
    endTime: Timestamp;
    signInPoints?: number;
    signOutPoints?: number;
    pointsPerHour?: number;
    locationName?: string;
    geoLocation?: Geolocation;
}

export interface SHPEEventLog {
    uid: number;
    points: number;
    signInTime?: Timestamp;
    signOutTime?: Timestamp;
}

export class GeneralMeeting implements SHPEEvent {
    public name: string;
    public description: string;
    public eventType: EventType;
    public tags: string[];
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints: number;
    public signOutPoints: number;

    constructor({ name, description, tags, startTime, endTime, signInPoints, signOutPoints }: {
        name?: string,
        description?: string,
        tags?: string[],
        startTime?: Timestamp,
        endTime?: Timestamp,
        signInPoints?: number,
        signOutPoints?: number,
    }) {
        this.name = name ?? "General Meeting";
        this.description = description ?? "";
        this.eventType = EventType.GENERAL_MEETING;
        this.tags = tags ?? [];
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now() + MillisecondTimes.HOUR);
        this.signInPoints = signInPoints ?? 0;
        this.signOutPoints = signOutPoints ?? 0;
    }
}

/**
 * Note: Study hours only give points if a user has signed both in and out
 */
export class StudyHours implements SHPEEvent {
    public name: string;
    public description: string;
    public eventType: EventType;
    public tags: string[];
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints?: number;
    public signOutPoints?: number;
    public pointsPerHour: number;

    /**
     * 
     * @param params Parameters to be passed into object.
     * @param durationHours Length of studyhours in amount of hours.
     */
    constructor({ name, description, tags, startTime, endTime, signInPoints, signOutPoints, pointsPerHour }: {
        name?: string,
        description?: string,
        tags?: string[],
        startTime?: Timestamp,
        endTime?: Timestamp,
        signInPoints?: number,
        signOutPoints?: number,
        pointsPerHour?: number,
    }) {
        this.name = name ?? "Study Hours";
        this.description = description ?? "";
        this.tags = tags ?? [];
        this.eventType = EventType.STUDY_HOURS;
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now() + MillisecondTimes.HOUR * 4);
        this.signInPoints = signInPoints ?? 0;
        this.signOutPoints = signOutPoints ?? 0;
        this.pointsPerHour = pointsPerHour ?? 2;
    }
}

export type WorkshopType = "Professional" | "Academic" | "None";

export class Workshop implements SHPEEvent {
    public name: string;
    public description: string;
    public tags: string[];
    public eventType: EventType;
    public workshopType: WorkshopType;
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints: number;

    constructor({ name, tags, description, workshopType, startTime, endTime, signInPoints }: {
        name?: string,
        tags?: string[],
        description: string,
        workshopType: WorkshopType,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? "Workshop";
        this.tags = tags ?? [];
        this.description = description ?? "";
        this.eventType = EventType.WORKSHOP;
        this.workshopType = workshopType ?? "None";
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now() + MillisecondTimes.HOUR);
        this.signInPoints = signInPoints ?? 0;
    }
}

export class VolunteerEvent implements SHPEEvent {
    public name: string;
    public tags: string[];
    public description: string;
    public eventType: EventType;
    public startTime: Timestamp;
    public endTime: Timestamp;
    public pointsPerHour: number;

    constructor({ name, tags, description, startTime, endTime, pointsPerHour }: {
        name?: string,
        tags?: string[],
        description?: string,
        startTime?: Timestamp,
        endTime?: Timestamp,
        pointsPerHour?: number,
    }) {
        this.name = name ?? "Volunteer Event";
        this.tags = tags ?? [];
        this.description = description ?? "";
        this.eventType = EventType.VOLUNTEER_EVENT;
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now() + MillisecondTimes.HOUR);
        this.pointsPerHour = pointsPerHour ?? 2;
    }
}

export class SocialEvent implements SHPEEvent {
    public name: string;
    public tags: string[];
    public description: string;
    public eventType: EventType;
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints: number;


    constructor({ name, tags, description, startTime, endTime, signInPoints }: {
        name: string,
        tags: string[],
        description: string,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? "Social Event";
        this.tags = tags ?? [];
        this.description = description ?? "";
        this.eventType = EventType.SOCIAL_EVENT;
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now());
        this.signInPoints = signInPoints ?? 1;
    }
}

export class CommitteeMeeting implements SHPEEvent {
    public name: string;
    public tags: string[];
    public description: string;
    public eventType: EventType;
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints: number;


    constructor({ name, tags, description, startTime, endTime, signInPoints }: {
        name: string,
        tags: string[],
        description: string,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? "Committee Meeting";
        this.tags = tags ?? [];
        this.description = description ?? "";
        this.eventType = EventType.COMMITTEE_MEETING;
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now());
        this.signInPoints = signInPoints ?? 1;
    }
}

export class IntramuralEvent implements SHPEEvent {
    public name: string;
    public tags: string[];
    public description: string;
    public eventType: EventType;
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints: number;

    constructor({ name, tags, description, startTime, endTime, signInPoints }: {
        name: string,
        tags: string[],
        description: string,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? "Intramural Event";
        this.tags = tags ?? [];
        this.description = description ?? "";
        this.eventType = EventType.INTRAMURAL_EVENT;
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now());
        this.signInPoints = signInPoints ?? 1;
    }
}

export class CustomEvent implements SHPEEvent {
    public id?: string;
    public name: string;
    public description: string;
    public eventType: string;
    public tags: string[];
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints?: number;
    public signOutPoints?: number;
    public pointsPerHour?: number;
    public locationName?: string;
    public geoLocation?: Geolocation;

    constructor({ id, name, description, tags, startTime, endTime, signInPoints, signOutPoints, pointsPerHour, locationName, geoLocation }: {
        id?: string;
        name?: string;
        description?: string;
        tags?: string[];
        startTime?: Timestamp;
        endTime?: Timestamp;
        signInPoints?: number;
        signOutPoints?: number;
        pointsPerHour?: number;
        locationName?: string;
        geoLocation?: Geolocation;
    }) {
        this.id = id;
        this.name = name ?? "Custom Event";
        this.description = description ?? "";
        this.eventType = EventType.CUSTOM_EVENT;
        this.tags = tags ?? [];
        this.startTime = startTime ?? Timestamp.fromMillis(Date.now());
        this.endTime = endTime ?? Timestamp.fromMillis(Date.now() + MillisecondTimes.HOUR);
        this.signInPoints = signInPoints;
        this.signOutPoints = signOutPoints;
        this.pointsPerHour = pointsPerHour;
        this.locationName = locationName;
        this.geoLocation = geoLocation
    }

}

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

export enum EventLogStatus {
    SUCCESS = "success",
    EVENT_OVER = "event_over",
    EVENT_ONGOING = "event_ongoing",
    ALREADY_LOGGED = "already_logged",
    ERROR = "error",
}

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
