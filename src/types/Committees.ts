import { ImageSourcePropType } from "react-native";

/**
 * These are values that don't need to be stored in firebase
 */
export const CommitteeConstants = {
    TECHNICALAFFAIRS: {
        name: "Technical Affairs",
        firebaseDocName: "technical-affairs",
        color: "#777777",
    },
    PUBLICRELATIONS: {
        name: "Public Relations",
        firebaseDocName: "public-relations",
        color: "#9337FF",
    },
    MENTORSHPE: {
        name: "MentorSHPE",
        firebaseDocName: "mentorshpe",
        color: "#404e5a",
    },
    SCHOLASTIC: {
        name: "Scholastic",
        firebaseDocName: "scholastic",
        color: "#F2CC10",
    },
    SHPETINAS: {
        name: "SHPEtinas",
        firebaseDocName: "shpetinas",
        color: "#1EFF42",
    },
    SECRETARY: {
        name: "Secretary",
        firebaseDocName: "secretary",
        color: "#FFA0D5",
    }, 
    INTERNALAFFAIRS: {
        name: "Internal Affairs",
        firebaseDocName: "internal-affairs",
        color: "#051DDB",
    },
    TREASURER: {
        name: "Treasurer",
        firebaseDocName: "treasurer",
        color: "#051DDB",
    },
} as const;

// Types for CommitteeConstant values
export type CommitteeKey = keyof typeof CommitteeConstants;
export type CommitteeVal = typeof CommitteeConstants[CommitteeKey];

const epic = "TECHNICALAFFAIRS";

CommitteeConstants[epic];


export type Committee = {
    name: string;
    firebaseDocName: string;
    color: string,
    image?: ImageSourcePropType;
    description?: string;
    headUID?: string;
    leadUIDs?: string[];
    memberCount?: number;
    memberApplicationLink?: string;
    leadApplicationLink?: string;
}
