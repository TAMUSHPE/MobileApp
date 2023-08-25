export const CommitteeConstants = {
    "TECHNICALAFFAIRS": "technical-affairs",
    "PUBLICRELATIONS": "public-relations",
    "MENTORSHPE": "mentorshpe",
    "SCHOLASTIC": "scholastic",
    "SHPETINAS" : "shpetinas",
    "SECRETARY": "secretary", 
    "INTERNALAFFAIRS": "internal-affairs",
    "TREASURER": "treasurer",
}


export type Committee = {
    name?: string;
    image?: number;
    description?: string;
    headUID?: string;
    leadUIDs?: string[];
    memberCount?: number;
    memberApplicationLink?: string;
    leadApplicationLink?: string;
}
