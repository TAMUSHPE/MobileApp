// temp type for testing
export interface SHPEEvent {
    name?: string;
    description?: string;
    pointsCategory?: string;
    notificationGroup?: string[];
    startDate?: string;
    endDate?: string;
    location?: string;
    image?: number;
}

export enum pointType {
    GENERAL_MEETING = 0,
    ACADEMIC_WORKSHOP = 1,
    ACADEMIC_SOCIAL = 2,
}



