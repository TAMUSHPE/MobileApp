import { View, Text, TouchableOpacity, Linking } from 'react-native'
import React, { useCallback } from 'react'
import { Octicons } from '@expo/vector-icons';
import { TestBankProps } from '../types/Navigation'
import * as WebBrowser from 'expo-web-browser'

const TestCard: React.FC<TestBankProps> = ({ testData, navigation }) => {
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

    const handlePress = useCallback(async () => {
        const supported = await Linking.canOpenURL(testURL);
        console.log(testURL)
        if (supported) {
            await WebBrowser.openBrowserAsync(testURL);
        } else {
            console.log(`Don't know how to open this URL: ${testURL}`);
        }
    }, [testURL]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <View className='flex-row my-5'>
                <View className='flex-1 pl-5'>
                    <View className="flex-row space-x-3 items-center">
                        <Text className='text-xl font-medium'>{subject} {course}</Text>
                        <Text className='text-xl font-medium'>{formatTestType} {typeNumber}</Text>
                        {(grade && grade != "N/A") && (
                            <View className='bg-maroon rounded-full w-9 h-9 items-center justify-center'>
                                <Text className='text-xl font-medium text-white text-center'>{Number(grade).toFixed(0)}</Text>
                            </View>
                        )}
                    </View>
                    <View className='flex-row space-x-2'>
                        <Text className='text-md font-medium text-[#808080]'>{formatSemester} {year}</Text>
                        {professor && (
                            <View className='flex-row space-x-2'>
                                <Text className='text-md font-medium text-[#808080]'>•</Text>
                                <Text className='text-md font-medium text-[#808080]'>{formatProfessor}</Text>
                            </View>
                        )}
                    </View>
                    {student && (
                        <Text className='text-md font-medium text-[#808080] mt-2'>Provided by {formatStudent}</Text>
                    )}
                </View>

                <View className='items-center justify-center pr-8'>
                    <Octicons name="chevron-right" size={25} color="black" />
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default TestCard