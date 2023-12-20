import { View, Text, TouchableOpacity, Linking, Image } from 'react-native'
import React, { useCallback, FC, SVGProps } from 'react'
import { TestBankProps } from '../types/Navigation'
import * as WebBrowser from 'expo-web-browser'
import { StatusBar } from 'expo-status-bar';
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
import { handleLinkPress } from '../helpers/links';


const TestCard: React.FC<TestBankProps> = ({ testData, navigation }) => {
    // Data is retrieved as all uppercase. This formats the data so only first letter of  each word is capitalized
    const capitalizeFirstLetter = (string: string) => {
        return string
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const { subject, course, semester, year, testType, typeNumber, professor, student, grade, testURL } = testData
    const formatTestType = testType ? capitalizeFirstLetter(testType) : null;
    const formatSemester = semester ? capitalizeFirstLetter(semester) : null;
    const formatStudent = student ? capitalizeFirstLetter(student) : null;
    const formatProfessor = professor ? capitalizeFirstLetter(professor) : null;

    const getGradeColor = (grade: string) => {
        const numericGrade = Number(grade);
        if (numericGrade >= 80) {
            return '#B6FF5D'; // Green
        } else if (numericGrade >= 60) {
            return '#FFE454'; // Yellow
        } else {
            return '#FF4545'; // Red
        }
    };

    const subjectIconMapping: SubjectIconMapping = {
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

    const getSubjectIcon = (subject: string): FC<SVGProps<SVGSVGElement>> => {
        const lowerCaseSubject = subject.replace(/\s+/g, '').toLowerCase() as SubjectCode;
        return subjectIconMapping[lowerCaseSubject] || subjectIconMapping['default'];
    };

    const SubjectIcon = getSubjectIcon(subject!);

    return (
        <View className='justify-center items-center mb-8'>
            <StatusBar style="light" />
            <TouchableOpacity onPress={() => handleLinkPress(testURL!)} className='flex-row w-[90%] h-32 bg-white rounded-xl shadow-md shadow-slate-300 py-4 px-1'>
                <View className='flex-1 items-center relative'>
                    <View className='bg-pale-blue w-[80%] h-full rounded-xl'>
                        <View className='flex-row items-center justify-center h-full'>
                            <SubjectIcon width={45} height={45} />
                        </View>
                    </View>

                    {(grade && grade != "N/A") && (
                        <View className='rounded-full w-9 h-9 items-center justify-center absolute bottom-0 right-0 -mb-2 -mr-1'
                            style={{ backgroundColor: getGradeColor(grade) }}
                        >
                            <Text className='text-xl font-medium text-center'>{Number(grade).toFixed(0)}</Text>
                        </View>
                    )}
                </View>
                <View className='flex-col w-[70%] ml-2'>
                    <View className='flex-row space-x-4'>
                        <Text className='text-2xl font-semibold'>{subject} {course}</Text>
                        <Text className='text-2xl font-semibold'>{formatTestType} {typeNumber}</Text>
                    </View>
                    <View className='flex-row space-x-2'>
                        <Text className='text-xl font-semibold text-[#808080]'>{formatSemester} {year}</Text>
                        {professor && (
                            <View className='flex-row space-x-2'>
                                <Text className='text-xl font-semibold text-[#808080]'>•</Text>
                                <Text className='text-xl font-semibold text-[#808080]'>{formatProfessor}</Text>
                            </View>
                        )}
                    </View>

                    <View className='flex-grow justify-end'>
                        {student && (
                            <Text className='text-md font-medium text-[#808080] mt-2'>Provided by {formatStudent}</Text>
                        )}
                    </View>
                </View>


            </TouchableOpacity>
        </View>
    )
}

type SubjectCode = 'acct' | 'aero' | 'astr' | 'bmen' | 'chem' | 'chen' | 'csce' | 'cven' | 'ecen' | 'engr' | 'hist' | 'isen' | 'math' | 'meen' | 'phil' | 'phys' | 'stat' | 'msen' | 'nuen' | 'wgst' | 'default';

type SubjectIconMapping = {
    [key in SubjectCode]: FC<SVGProps<SVGSVGElement>>;
};

export default TestCard

