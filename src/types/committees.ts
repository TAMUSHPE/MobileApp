import SHPEtinas from '../../assets/shpetinas_icon.svg';
import TechnicalAffairs from '../../assets/technical_affairs_icon.svg';
import DefaultIcon from '../../assets/generic_course_icon.svg';
import Scholastic from '../../assets/scholastic_committee_icon.svg';
import MentorSHPE from '../../assets/mentorshpe_committee_icon.svg';
import Presidents from '../../assets/presidents_committee_icon.svg';
import PublicRelations from '../../assets/public_relations_committee_icon.svg';
import JonesSHPEjr from '../../assets/jones_shpe_jr_committee.svg';
import Treasurer from '../../assets/treasurer_committee_icon.svg';
import InternalAffairs from '../../assets/internal_affairs_committee_icon.svg';
import Secretary from '../../assets/secretary_committee_icon.svg';
import ProfessionalDevelopment from '../../assets/professional_development_committee_icon.svg';


/**
 * This contains the logo options for committees. If you want to add a new logo, add it here.
 * These logo must be SVGs. [width, height] is the size of the logo in pixels.
 * The best width and height is 75x75 for squares and 105x90 for rectangles.
 * But should be adjusted according to the dimension of added logo
 */
export const committeeLogos = {
    professionalDevelopment: {
        LogoComponent: ProfessionalDevelopment,
        width: 80,
        height: 80
    },
    internalAffairs: {
        LogoComponent: InternalAffairs,
        width: 80,
        height: 80
    },
    secretary: {
        LogoComponent: Secretary,
        width: 80,
        height: 80
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

export const getLogoComponent = (logoName: keyof typeof committeeLogos = 'default', color?: string) => {
    const logo = committeeLogos[logoName] || committeeLogos['default'];
    return { ...logo, color };
};

export type CommitteeLogosName = keyof typeof committeeLogos;


export type Committee = {
    firebaseDocName?: string;
    name?: string;
    color?: string,
    description?: string;
    head?: string;
    representatives?: string[];
    leads?: string[];
    memberApplicationLink?: string;
    representativeApplicationLink?: string;
    leadApplicationLink?: string;
    logo?: keyof typeof committeeLogos;
    memberCount?: number;
    isOpen?: boolean;
}

export const reverseFormattedFirebaseName = (firebaseName: string) => {
    return firebaseName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
