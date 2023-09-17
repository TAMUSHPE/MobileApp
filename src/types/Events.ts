import { Timestamp } from 'firebase/firestore'; 

export interface SHPEEvent {
    name?: string;
    description?: string;
    pointsCategory?: string;
    startDate?: Timestamp;
    endDate?: Timestamp;
    location?: string; // temp
    notificationGroup?: string;
    attendance?: number;
    image?: number; // temp
}
export interface SHPEEventID extends SHPEEvent {
    id?: string
}


export enum EventLogStatus {
    SUCCESS = "success",
    EVENT_OVER = "event_over",
    ALREADY_LOGGED = "already_logged",
    ERROR = "error",
}

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];




