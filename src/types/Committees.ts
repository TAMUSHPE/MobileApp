import { PublicUserInfo } from "./User";
import SHPEtinas from '../../assets/shpetinas.svg';
import TechnicalAffairs from '../../assets/technical_affairs_logo.svg';
import DefaultIcon from '../../assets/generic_course_icon.svg';


/**
 * This contains the logo options for committees. If you want to add a new logo, add it here.
 * These logo must be SVGs. [width, height] is the size of the logo in pixels.
 * The best width and height is 75x75 for squares and 105x90 for rectangles.
 * But should be adjusted according to the dimension of added logo
 */
export const committeeLogos = {
    shpetinas: {
        LogoComponent: SHPEtinas,
        width: 100,
        height: 100
    },
    technicalAffairs: {
        LogoComponent: TechnicalAffairs,
        width: 75,
        height: 80
    },
    default: {
        LogoComponent: DefaultIcon,
        width: 60,
        height: 60
    },
};

export const getLogoComponent = (logoName: keyof typeof committeeLogos = 'default') => {
    return committeeLogos[logoName];
};

export type CommitteeLogosName = keyof typeof committeeLogos;


export type Committee = {
    firebaseDocName?: string;
    name?: string;
    color?: string,
    description?: string;
    head?: PublicUserInfo;
    representatives?: PublicUserInfo[];
    leads?: PublicUserInfo[];
    memberApplicationLink?: string;
    representativeApplicationLink?: string;
    leadApplicationLink?: string;
    logo?: keyof typeof committeeLogos;
    memberCount?: number;
}

