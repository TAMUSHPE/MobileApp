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
import TechnicalAffairsWhite from '../../assets/technical_affairs_icon_white.svg';
import DefaultIconWhite from '../../assets/generic_course_icon_white.svg';
import ScholasticWhite from '../../assets/scholastic_committee_icon_white.svg';
import MentorSHPEWhite from '../../assets/mentorshpe_committee_icon_white.svg';
import PresidentsWhite from '../../assets/presidents_committee_icon_white.svg';
import PublicRelationsWhite from '../../assets/public_relations_committee_icon_white.svg';
import JonesSHPEjrWhite from '../../assets/jones_shpe_jr_committee_white.svg';
import TreasurerWhite from '../../assets/treasurer_committee_icon_white.svg';
import InternalAffairsWhite from '../../assets/internal_affairs_committee_icon_white.svg';
import SecretaryWhite from '../../assets/secretary_committee_icon_white.svg';
import ProfessionalDevelopmentWhite from '../../assets/professional_development_committee_icon_white.svg';



/**
 * This contains the logo options for committees. If you want to add a new logo, add it here.
 * These logo must be SVGs. [width, height] is the size of the logo in pixels.
 * The best width and height is 75x75 for squares and 105x90 for rectangles.
 * But should be adjusted according to the dimension of added logo
 */
export const committeeLogos = {
    professionalDevelopment: {
        LogoComponent: ProfessionalDevelopment,
        LightLogoComponent: ProfessionalDevelopmentWhite,
        width: 80,
        height: 80
    },
    internalAffairs: {
        LogoComponent: InternalAffairs,
        LightLogoComponent: InternalAffairsWhite,
        width: 80,
        height: 80
    },
    secretary: {
        LogoComponent: Secretary,
        LightLogoComponent: SecretaryWhite,
        width: 80,
        height: 80
    },
    treasurer: {
        LogoComponent: Treasurer,
        LightLogoComponent: TreasurerWhite,
        width: 100,
        height: 100
    },
    jonesSHPEjr: {
        LogoComponent: JonesSHPEjr,
        LightLogoComponent: JonesSHPEjrWhite,
        width: 75,
        height: 65
    },
    publicRelations: {
        LogoComponent: PublicRelations,
        LightLogoComponent: PublicRelationsWhite,
        width: 100,
        height: 80
    },
    scholasticCommittee: {
        LogoComponent: Scholastic,
        LightLogoComponent: ScholasticWhite,
        width: 75,
        height: 70
    },
    presidentsCommittee: {
        LogoComponent: Presidents,
        LightLogoComponent: PresidentsWhite,
        width: 75,
        height: 70
    },
    mentorshpeCommittee: {
        LogoComponent: MentorSHPE,
        LightLogoComponent: MentorSHPEWhite,
        width: 70,
        height: 70
    },
    shpetinas: {
        LogoComponent: SHPEtinas,
        LightLogoComponent: SHPEtinas,
        width: 100,
        height: 100
    },
    technicalAffairs: {
        LogoComponent: TechnicalAffairs,
        LightLogoComponent: TechnicalAffairsWhite,
        width: 75,
        height: 80
    },
    default: {
        LogoComponent: DefaultIcon,
        LightLogoComponent: DefaultIconWhite,
        width: 60,
        height: 60
    },
};

export const getLogoComponent = (logoName: keyof typeof committeeLogos = 'default') => {
    return committeeLogos[logoName] || committeeLogos['default'];
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
    applicationLink?: string;
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
