import { View, Text, TouchableOpacity, useColorScheme } from 'react-native'
import React, { useContext } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserContext } from '../../context/UserContext';
import { handleLinkPress } from '../../helpers/links';
import { ResourcesStackParams } from '../../types/navigation'
import { SubjectCode, subjectIconMapping } from '../../types/testBank';
import { Test } from '../../types/googleSheetsTypes';


const TestCard: React.FC<TestBankProps> = ({ testData }) => {
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

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const getGradeColor = (grade: string) => {
        const numericGrade = Number(grade);
        if (numericGrade >= 80) return '#AEF359'; // Green
        if (numericGrade >= 60) return '#FFE454'; // Yellow
        return '#FF0000'; // Red
    };

    const getSubjectIcon = (subject: string): React.FC<React.SVGProps<SVGSVGElement>> => {
        const lowerCaseSubject = subject.replace(/\s+/g, '').toLowerCase() as SubjectCode;
        return subjectIconMapping[lowerCaseSubject] || subjectIconMapping['default'];
    };

    const SubjectIcon = getSubjectIcon(subject!);

    return (
        <View className='justify-center items-center my-4'>
            <TouchableOpacity
                className={`flex-row w-[90%] h-32 rounded-xl  py-4 px-1 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                style={{
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}
                onPress={() => handleLinkPress(testURL!)}
            >
                <View className='flex-1 items-center relative'>
                    <View className='bg-primary-blue w-[80%] h-full rounded-xl'>
                        <View className='flex-row items-center justify-center h-full'>
                            <SubjectIcon width={45} height={45} />
                        </View>
                    </View>

                    {(grade && grade !== "N/A") && (
                        <View style={{ backgroundColor: getGradeColor(grade) }} className='rounded-full w-9 h-9 absolute bottom-0 right-0 -mb-2 -mr-1 items-center justify-center'>
                            <Text className='text-xl font-medium'>{parseInt(grade, 10)}</Text>
                        </View>
                    )}
                </View>
                <View className='flex-col w-[70%] ml-2'>
                    <View className='flex-row space-x-4'>
                        <Text className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>{subject} {course}</Text>
                        <Text className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>{formatTestType} {typeNumber}</Text>
                    </View>
                    <View className='flex-row space-x-2'>
                        <Text className={`text-xl font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>{formatSemester} {year}</Text>
                        {professor && (
                            <View className='flex-row space-x-2'>
                                <Text className={`text-xl font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>•</Text>
                                <Text className={`text-xl font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>{truncateStringWithEllipsis(formatProfessor || "", 8)}</Text>
                            </View>
                        )}
                    </View>

                    <View className='flex-grow justify-end'>
                        {student && (
                            <Text className={`text-md font-medium mt-2 ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>Provided by {truncateStringWithEllipsis(formatStudent || "", 15)}</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    )
}

type TestBankProps = {
    testData: Test;
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}

const truncateStringWithEllipsis = (name: string, limit = 22) => {
    if (name.length > limit) {
        return `${name.substring(0, limit)}...`;
    }
    return name;
};



export default TestCard

