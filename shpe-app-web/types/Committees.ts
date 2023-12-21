import { PublicUserInfo } from "./User";

export type Committee = {
    name?: string;
    firebaseDocName?: string;
    color?: string,
    image?: string;
    description?: string;
    head?: PublicUserInfo;
    leads?: PublicUserInfo[];
    memberCount?: number;
    memberApplicationLink?: string;
    leadApplicationLink?: string;
}