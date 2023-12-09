import { ImageSourcePropType } from "react-native";
import { PublicUserInfo } from "./User";

export type Committee = {
    name?: string;
    firebaseDocName?: string;
    color?: string,
    image?: ImageSourcePropType;
    description?: string;
    head?: PublicUserInfo;
    leads?: PublicUserInfo[];
    memberApplicationLink?: string;
    leadApplicationLink?: string;
}
