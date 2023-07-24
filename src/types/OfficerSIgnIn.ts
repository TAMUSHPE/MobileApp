import { Timestamp, FieldValue } from 'firebase/firestore';

export interface OfficerStatus {
    signedIn: boolean;
    timestamp: Timestamp  | FieldValue
  }