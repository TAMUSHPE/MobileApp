import ACCTIcon from '../../assets/acct_icon.svg';
import AEROIcon from '../../assets/aero_icon.svg';
import ASTRIcon from '../../assets/astr_icon.svg';
import BMENIcon from '../../assets/bmen_icon.svg';
import CHEMIcon from '../../assets/chem_icon.svg';
import CHENIcon from '../../assets/chen_icon.svg';
import CSCEIcon from '../../assets/csce_icon.svg';
import CVENIcon from '../../assets/cven_icon.svg';
import ECENIcon from '../../assets/ecen_icon.svg';
import ENGRIcon from '../../assets/engr_icon.svg';
import HISTIcon from '../../assets/hist_icon.svg';
import ISENIcon from '../../assets/isen_icon.svg';
import MATHIcon from '../../assets/math_icon.svg';
import MEENIcon from '../../assets/meen_icon.svg';
import PHILIcon from '../../assets/phil_icon.svg';
import PHYSIcon from '../../assets/phys_icon.svg';
import STATIcon from '../../assets/stat_icon.svg';
import MSENIcon from '../../assets/msen_icon.svg';
import NUENIcon from '../../assets/nuen_icon.svg';
import WGSTIcon from '../../assets/wgst_icon.svg';
import DefaultIcon from '../../assets/generic_course_icon.svg';

export type SubjectCode = 'acct' | 'aero' | 'astr' | 'bmen' | 'chem' | 'chen' | 'csce' | 'cven' | 'ecen' | 'engr' | 'hist' | 'isen' | 'math' | 'meen' | 'phil' | 'phys' | 'stat' | 'msen' | 'nuen' | 'wgst' | 'default';

type SubjectIconMapping = {
    [key in SubjectCode]: React.FC<React.SVGProps<SVGSVGElement>>;
};

export const subjectIconMapping: SubjectIconMapping = {
    'acct': ACCTIcon,
    'aero': AEROIcon,
    'astr': ASTRIcon,
    'bmen': BMENIcon,
    'chem': CHEMIcon,
    'chen': CHENIcon,
    'csce': CSCEIcon,
    'cven': CVENIcon,
    'ecen': ECENIcon,
    'engr': ENGRIcon,
    'hist': HISTIcon,
    'isen': ISENIcon,
    'math': MATHIcon,
    'meen': MEENIcon,
    'phil': PHILIcon,
    'phys': PHYSIcon,
    'stat': STATIcon,
    'msen': MSENIcon,
    'nuen': NUENIcon,
    'wgst': WGSTIcon,
    'default': DefaultIcon
};
export const SUBJECTCODES = [
    { subject: "Accounting", iso: "ACCT" },
    { subject: "Aerospace Engineering", iso: "AERO" },
    { subject: "Astronomy", iso: "ASTR" },
    { subject: "Biomedical Engineering", iso: "BMEN" },
    { subject: "Chemistry", iso: "CHEM" },
    { subject: "Chemical Engineering", iso: "CHEN" },
    { subject: "Computer Science and Engineering", iso: "CSCE" },
    { subject: "Civil Engineering", iso: "CVEN" },
    { subject: "Electrical and Computer Engineering", iso: "ECEN" },
    { subject: "Engineering", iso: "ENGR" },
    { subject: "History", iso: "HIST" },
    { subject: "Industrial and Systems Engineering", iso: "ISEN" },
    { subject: "Mathematics", iso: "MATH" },
    { subject: "Mechanical Engineering", iso: "MEEN" },
    { subject: "Philosophy", iso: "PHIL" },
    { subject: "Physics", iso: "PHYS" },
    { subject: "Statistics", iso: "STAT" },
    { subject: "Materials Science and Engineering", iso: "MSEN" },
    { subject: "Nuclear Engineering", iso: "NUEN" },
    { subject: "Women's and Gender Studies", iso: "WGST" }
];
