import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar';
import { ResourcesStackParams } from '../../types/navigation'
import { SubjectCode, subjectIconMapping } from '../../types/testBank';
import { handleLinkPress } from '../../helpers/links';
import { Test } from '../../types/googleSheetsTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


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

    const getGradeColor = (grade: string) => {
        const numericGrade = Number(grade);
        if (numericGrade >= 80) return '#B6FF5D'; // Green
        if (numericGrade >= 60) return '#FFE454'; // Yellow
        return '#FF4545'; // Red
    };

    const getSubjectIcon = (subject: string): React.FC<React.SVGProps<SVGSVGElement>> => {
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

                    {(grade && grade !== "N/A") && (
                        <View style={{ backgroundColor: getGradeColor(grade) }} className='rounded-full w-9 h-9 absolute bottom-0 right-0 -mb-2 -mr-1 items-center justify-center'>
                            <Text className='text-xl font-medium'>{parseInt(grade, 10)}</Text>
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

export type TestBankProps = {
    testData: Test;
    navigation: NativeStackNavigationProp<ResourcesStackParams>
}


export default TestCard

