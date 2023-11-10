import { Timestamp } from 'firebase/firestore';

export interface SHPEEvent {
    id: string;
    name: string;
    description: string;
    eventType: string;
    tags: string[];
    startTime: Timestamp;
    endTime: Timestamp;
    signInPoints?: number;
    signOutPoints?: number;
    locationName?: string;
    geoLocation?: Geolocation;
    notificationGroup?: string;
    image?: number;
}

export interface SHPEEventLog {
    uid: number;
    points: number;
    signInTime?: Timestamp;
    signOutTime?: Timestamp;
}

export interface EventMessage {

}

export class GeneralMeeting implements SHPEEvent {
    public id: string;
    public name: string;
    public description: string;
    public eventType: EventType;
    public tags: string[];
    public startTime: Timestamp;
    public endTime: Timestamp;

    constructor({ id, name, description, tags, startTime, endTime, }: {
        id: string,
        name: string,
        description: string,
        eventType: EventType,
        tags: string[],
        startTime: Timestamp,
        endTime: Timestamp,
    }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.eventType = EventType.GENERAL_MEETING;
        this.tags = tags;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

export class StudyHours implements SHPEEvent {
    public id: string;
    public name: string;
    public description: string;
    public eventType: EventType;
    public tags: string[];
    public startTime: Timestamp;
    public endTime: Timestamp;
    public signInPoints?: number;
    public signOutPoints?: number;

    /**
     * 
     * @param params Parameters to be passed into object.
     * @param durationHours Length of studyhours in amount of hours.
     */
    constructor({ id, name, description, tags, startTime, signInPoints, signOutPoints }: {
        id: string,
        name: string,
        description: string,
        tags: string[],
        startTime: Timestamp,
        signInPoints: number,
        signOutPoints: number,
    }, durationHours: number = 4) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.tags = tags;
        this.eventType = EventType.STUDY_HOURS;
        this.startTime = startTime;
        this.endTime = new Timestamp(startTime.seconds + (durationHours * 60 * 60), startTime.nanoseconds);
        this.signInPoints = signInPoints;
        this.signOutPoints = signOutPoints;
    }
}

/*
export class Workshop implements SHPEEvent {
    public id: string;
    public name: string;
    public description: string;


    constructor() {
        
    }
}

export class VolunteerEvent implements SHPEEvent {
    constructor() {

    }
}

export class SocialEvent implements SHPEEvent {
    constructor() {

    }
}

export class CommitteeMeeting implements SHPEEvent {
    constructor({ id }) {

    }
}

export class IntramuralEvent implements SHPEEvent {

}
*/

export enum EventType {
    GENERAL_MEETING = "General Meeting",
    COMMITTEE_MEETING = "Committee Meeting",
    STUDY_HOURS = "Study Hours",

}

export enum EventLogStatus {
    SUCCESS = "success",
    EVENT_OVER = "event_over",
    EVENT_ONGOING = "event_ongoing",
    ALREADY_LOGGED = "already_logged",
    ERROR = "error",
}

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
