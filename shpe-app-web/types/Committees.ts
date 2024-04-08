import { PublicUserInfo } from "./User";
import SHPEtinas from '../../assets/shpetinas.svg';
import TechnicalAffairs from '../../assets/technical_affairs_logo.svg';
import DefaultIcon from '../../assets/generic_course_icon.svg';


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