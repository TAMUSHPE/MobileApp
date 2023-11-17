import { Timestamp } from 'firebase/firestore';
import { MillisecondTimes, getNextHourMillis } from '../helpers';

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

    public constructor() {
        this.name = "General Meeting";
        this.description = "";
        this.eventType = EventType.GENERAL_MEETING;
        this.tags = [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 0;
        this.signOutPoints = 0;
    }

    public copyFromObject({ name, description, tags, startTime, endTime, signInPoints, signOutPoints }: {
        name?: string,
        description?: string,
        tags?: string[],
        startTime?: Timestamp,
        endTime?: Timestamp,
        signInPoints?: number,
        signOutPoints?: number,
    }) {
        this.name = name ?? this.name;
        this.description = description ?? this.description;
        this.tags = tags ?? this.tags;
        this.startTime = startTime ?? this.startTime;
        this.endTime = endTime ?? this.endTime;
        this.signInPoints = signInPoints ?? this.signInPoints;
        this.signOutPoints = signOutPoints ?? this.signOutPoints;
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
    public signInPoints: number;
    public signOutPoints: number;
    public pointsPerHour: number;

    public constructor() {
        this.name = "Study Hours";
        this.description = "";
        this.eventType = EventType.STUDY_HOURS;
        this.tags = [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR * 4);
        this.signInPoints = 0;
        this.signOutPoints = 0;
        this.pointsPerHour = 1
    }

    public copyFromObject({ name, description, tags, startTime, endTime, signInPoints, signOutPoints, pointsPerHour }: {
        name?: string,
        description?: string,
        tags?: string[],
        startTime?: Timestamp,
        endTime?: Timestamp,
        signInPoints?: number,
        signOutPoints?: number,
        pointsPerHour?: number,
    }) {
        this.name = name ?? this.name;
        this.description = description ?? this.description;
        this.tags = tags ?? [];
        this.startTime = startTime ?? this.startTime;
        this.endTime = endTime ?? this.endTime;
        this.signInPoints = signInPoints ?? this.signInPoints;
        this.signOutPoints = signOutPoints ?? this.signOutPoints;
        this.pointsPerHour = pointsPerHour ?? this.pointsPerHour;
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

    public constructor() {
        this.name = "Workshop";
        this.description = "";
        this.tags = [];
        this.eventType = EventType.WORKSHOP;
        this.workshopType = "None";
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 3;
    }

    public copyFromObject({ name, tags, description, workshopType, startTime, endTime, signInPoints }: {
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
        this.description = description ?? this.description;
        this.workshopType = workshopType ?? "None";
        this.startTime = startTime ?? Timestamp.fromMillis(getNextHourMillis());
        this.endTime = endTime ?? Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
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

    public constructor() {
        this.name = "Volunteer Event";
        this.tags = [];
        this.description = "";
        this.eventType = EventType.VOLUNTEER_EVENT;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.pointsPerHour = 2;
    }

    public copyFromObject({ name, tags, description, startTime, endTime, pointsPerHour }: {
        name?: string,
        tags?: string[],
        description?: string,
        startTime?: Timestamp,
        endTime?: Timestamp,
        pointsPerHour?: number,
    }) {
        this.name = name ?? this.name;
        this.tags = tags ?? this.tags;
        this.description = description ?? this.description;
        this.startTime = startTime ?? this.startTime;
        this.endTime = endTime ?? this.endTime;
        this.pointsPerHour = pointsPerHour ?? this.pointsPerHour;
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

    public constructor() {
        this.name = "Social Event";
        this.tags = [];
        this.description = "";
        this.eventType = EventType.SOCIAL_EVENT;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 1;
    }

    public copyFromObject({ name, tags, description, startTime, endTime, signInPoints }: {
        name: string,
        tags: string[],
        description: string,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? this.name;
        this.tags = tags ?? this.tags;
        this.description = description ?? this.description;
        this.startTime = startTime ?? this.startTime;
        this.endTime = endTime ?? this.endTime;
        this.signInPoints = signInPoints ?? this.signInPoints;
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

    public constructor() {
        this.name = "Committee Meeting";
        this.tags = [];
        this.description = "";
        this.eventType = EventType.COMMITTEE_MEETING;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 1;
    }

    public copyFromObject({ name, tags, description, startTime, endTime, signInPoints }: {
        name: string,
        tags: string[],
        description: string,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? this.name;
        this.tags = tags ?? this.tags;
        this.description = description ?? this.description;
        this.startTime = startTime ?? this.startTime;
        this.endTime = endTime ?? this.endTime;
        this.signInPoints = signInPoints ?? this.signInPoints;
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

    public constructor() {
        this.name = "Intramural Event";
        this.tags = [];
        this.description = "";
        this.eventType = EventType.INTRAMURAL_EVENT;
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = 1;
    }

    public copyFromObject({ name, tags, description, startTime, endTime, signInPoints }: {
        name: string,
        tags: string[],
        description: string,
        startTime: Timestamp,
        endTime: Timestamp,
        signInPoints: number,
    }) {
        this.name = name ?? this.name;
        this.tags = tags ?? this.tags;
        this.description = description ?? this.description;
        this.startTime = startTime ?? this.startTime;
        this.endTime = endTime ?? this.endTime;
        this.signInPoints = signInPoints ?? this.signInPoints;
    }
}

export class CustomEvent implements SHPEEvent {
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

    public constructor() {
        this.name = "Custom Event";
        this.description = "";
        this.eventType = EventType.CUSTOM_EVENT;
        this.tags = [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = undefined;
        this.signOutPoints = undefined;
        this.pointsPerHour = undefined;
        this.locationName = undefined;
        this.geoLocation = undefined;
    }

    public copyFromObject({ name, description, tags, startTime, endTime, signInPoints, signOutPoints, pointsPerHour, locationName, geoLocation }: {
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
        this.name = name ?? "Custom Event";
        this.description = description ?? this.description;
        this.eventType = EventType.CUSTOM_EVENT;
        this.tags = tags ?? [];
        this.startTime = Timestamp.fromMillis(getNextHourMillis());
        this.endTime = Timestamp.fromMillis(getNextHourMillis() + MillisecondTimes.HOUR);
        this.signInPoints = signInPoints;
        this.signOutPoints = signOutPoints;
        this.pointsPerHour = pointsPerHour;
        this.locationName = locationName;
        this.geoLocation = geoLocation;
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
