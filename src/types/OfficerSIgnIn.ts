import { User } from "./User";

export interface OfficerStatus {
    uid?: string
    officer: User
    status: "signedIn" | "signedOut"
    time: Date
}