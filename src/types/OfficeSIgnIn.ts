import { Timestamp, FieldValue } from 'firebase/firestore';

export interface OfficerStatus {
    uid: string;
    signedIn: boolean;
    timestamp: Timestamp  | FieldValue
}

export interface MemberStatus {
    uid: string;
    timestamp: Timestamp | FieldValue;
}