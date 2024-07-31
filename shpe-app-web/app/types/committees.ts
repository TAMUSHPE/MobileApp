import SHPEtinas from '/public/shpetinas_icon.svg';
import TechnicalAffairs from '/public/technical_affairs_icon.svg';
import DefaultIcon from '/public/generic_course_icon.svg';
import Scholastic from '/public/scholastic_committee_icon.svg';
import MentorSHPE from '/public/mentorshpe_committee_icon.svg';
import Presidents from '/public/presidents_committee_icon.svg';
import PublicRelations from '/public/public_relations_committee_icon.svg';
import JonesSHPEjr from '/public/jones_shpe_jr_committee.svg';
import Treasurer from '/public/treasurer_committee_icon.svg';
import InternalAffairs from '/public/internal_affairs_committee_icon.svg';
import Secretary from '/public/secretary_committee_icon.svg';
import ProfessionalDevelopment from '/public/professional_development_committee_icon.svg';
import { PublicUserInfo } from "./user";


/** ===================================================================================
 *  The content below must only be changed to match MobileApp/src/types/Committees.ts
 * 
 *  You may manually add any imports above at the top of this file if needed
 *  ===================================================================================
 *  */


/**
 * This contains the logo options for committees. If you want to add a new logo, add it here.
 * These logo must be SVGs. [width, height] is the size of the logo in pixels.
 * The best width and height is 75x75 for squares and 105x90 for rectangles.
 * But should be adjusted according to the dimension of added logo
 */
export const committeeLogos = {
    professionalDevelopment: {
        LogoComponent: ProfessionalDevelopment,
        width: 100,
        height: 100
    },
    internalAffairs: {
        LogoComponent: InternalAffairs,
        width: 100,
        height: 100
    },
    secretary: {
        LogoComponent: Secretary,
        width: 100,
        height: 100
    },
    treasurer: {
        LogoComponent: Treasurer,
        width: 100,
        height: 100
    },
    jonesSHPEjr: {
        LogoComponent: JonesSHPEjr,
        width: 75,
        height: 65
    },
    publicRelations: {
        LogoComponent: PublicRelations,
        width: 100,
        height: 80
    },
    scholasticCommittee: {
        LogoComponent: Scholastic,
        width: 75,
        height: 70
    },
    presidentsCommittee: {
        LogoComponent: Presidents,
        width: 75,
        height: 70
    },
    mentorshpeCommittee: {
        LogoComponent: MentorSHPE,
        width: 70,
        height: 70
    },
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
    return committeeLogos[logoName] || committeeLogos['default'];
};
export type CommitteeLogosName = keyof typeof committeeLogos;

export type Committee = {
   name?: string;
   firebaseDocName?: string;
   color?: string,
   logo?: string;
   description?: string;
   head?: PublicUserInfo;
   leads?: PublicUserInfo[];
   memberCount?: number;
   memberApplicationLink?: string;
   leadApplicationLink?: string;
}

export const reverseFormattedFirebaseName = (firebaseName: string) => {
    return firebaseName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
