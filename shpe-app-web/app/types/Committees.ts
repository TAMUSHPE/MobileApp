import { PublicUserInfo } from "./User";
import SHPEtinas from '../public/shpetinas_icon.svg';
import TechnicalAffairs from '../public/technical_affairs_icon.svg';
import DefaultIcon from '../public/generic_course_icon.svg';
import Secretary from '../public/secretary_committee_icon.svg';
import Scholastic from '../public/scholastic_committee_icon.svg'
import Presidents from '../public/presidents_committee_icon.svg'
import ProfessionalDevelopment from '../public/professional_development_committee_icon.svg'
import MentorSHPE from '../public/mentorshpe_committee_icon.svg'
import Treasurer from '../public/treasurer_committee_icon.svg'
import JonesSHPEjr from '../public/jones_shpe_jr_committee.svg'
import PublicRelations from '../public/public_relations_committee_icon.svg'
import InternalAffairs from '../public/internal_affairs_committee_icon.svg';

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
   return committeeLogos[logoName];
};


export type CommitteeLogosName = keyof typeof committeeLogos;