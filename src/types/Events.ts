// temp type for testing
export interface SHPEEvent {
    name?: string;
    description?: string;
    pointsCategory?: string;
    notificationGroup?: string[];
    startDate?: string;
    endDate?: string;
    location?: string;
    attendance?: number;
    image?: number;
}
export interface SHPEEventID extends SHPEEvent {
    id?: string
}


export enum pointType {
    GENERAL_MEETING = "0",
    ACADEMIC_WORKSHOP = "1",
    ACADEMIC_SOCIAL = "2",
}



