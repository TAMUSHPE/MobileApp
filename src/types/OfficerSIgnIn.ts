import { Timestamp, FieldValue } from 'firebase/firestore';

export interface OfficerStatus {
    uid: string;
    signedIn: boolean;
    timestamp: Timestamp  | FieldValue
  }