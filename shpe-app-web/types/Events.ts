import { Timestamp } from 'firebase/firestore'; 

export interface SHPEEvent {
    name?: string;
    description?: string;
    pointsCategory?: string;
    startDate?: Timestamp;
    endDate?: Timestamp;
    location?: string; // temp
    notificationGroup?: string;
    image?: number; // temp
}
export interface SHPEEventID extends SHPEEvent {
    id?: string
}


export enum EventLogStatus {
    SUCCESS = "success",
    EVENT_OVER = "event_over",
    EVENT_ONGOING  = "event_ongoing",
    ALREADY_LOGGED = "already_logged",
    ERROR = "error",
}

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];