import { Timestamp, FieldValue } from 'firebase/firestore';

export interface MemberStatus {
    uid: string;
    timestamp: Timestamp | FieldValue;
}

export interface OfficerStatus extends MemberStatus {
    signedIn: boolean;
}