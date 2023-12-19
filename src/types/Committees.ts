import { ImageSourcePropType } from "react-native";
import { PublicUserInfo } from "./User";

import SHPEtinas from '../../assets/shpetinas.svg';
import TechnicalAffairs from '../../assets/technical_affairs_logo.svg';
import DefaultIcon from '../../assets/generic_course_icon.svg';
export const committeeLogos = {
    shpetinas: SHPEtinas,
    technicalAffairs: TechnicalAffairs,
    default: DefaultIcon,
};


export const getLogoComponent = (logoName: keyof typeof committeeLogos = 'default') => {
    return committeeLogos[logoName];
};

export type CommitteeLogosName = keyof typeof committeeLogos;


export type Committee = {
    name?: string;
    firebaseDocName?: string;
    color?: string,
    image?: ImageSourcePropType;
    description?: string;
    head?: PublicUserInfo;
    leads?: PublicUserInfo[];
    memberCount?: number;
    memberApplicationLink?: string;
    leadApplicationLink?: string;
    logo?: keyof typeof committeeLogos;
}

