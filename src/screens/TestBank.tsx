import { View, Text, TouchableHighlight, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TestCard from '../components/TestCard';
import { ResourcesStackParams } from '../types/Navigation';
import { Test, GoogleSheetsResponse } from '../types/GoogleSheetsTypes';
import { GoogleSheetsIDs, queryGoogleSpreadsheet } from '../api/fetchGoogleSheets';


const TestBank = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const [testCards, setTestCards] = useState<Test[]>([])
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [loading, setLoading] = useState(true);

    const prepTestSheet = async (data: GoogleSheetsResponse, offset: number): Promise<Test[]> => {
        const dataRow = data.table.rows;
        // console.log(JSON.stringify(dataRow, null, 2))
        const examsDataPromises = dataRow.map(async (entry, index) => {
            return {
                subject: entry.c[0]?.v,
                course: entry.c[1]?.f,
                semester: entry.c[2]?.v,
                year: entry.c[3]?.v,
                testType: entry.c[4]?.v,
                typeNumber: entry.c[5]?.f,
                professor: entry.c[6]?.v,
                student: entry.c[7]?.v,
                grade: entry.c[8]?.v,
                testURL: entry.c[9]?.v,
            };
        });

        return await Promise.all(examsDataPromises);
    }

    const queryAndSetRanks = async (limit: number, offset: number) => {
        const query = `select A, B, C, D, E, F, G, H, J, K LIMIT ${limit} OFFSET ${offset}`;
        queryGoogleSpreadsheet(GoogleSheetsIDs.TEST_BANK_ID, query, "Database")
            .then(response => {
                setLoading(true);
                return prepTestSheet(response!, offset)
            }).then(data => {
                setTestCards([...testCards, ...data]);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            }).finally(() => {
                setLoading(false);
            })
    }
    console.log(loading)

    useEffect(() => {
        const fetchData = async () => {
            queryAndSetRanks(20, 0);
        }
        fetchData();
    }, [])


    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(nativeEvent)) {
            setLoading(true);
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
                const offset = testCards.length;
                queryAndSetRanks(20, offset);
                debounceTimer.current = null;
            }, 300);
        }
    };

    return (
        <SafeAreaView
            className='bg-red-orange h-full'
            edges={['right', 'top', 'left', 'bottom']}
        >
            {/* Header */}
            < View className={`bg-offwhite ${testCards.length === 0 && "h-screen"}`} >
                <View className='flex-row items-center justify-between px-6 mt-4 pt-4 pb-2'>
                    <TouchableHighlight onPress={() => navigation.goBack()} underlayColor="offwhite">
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableHighlight>
                    <Text className='text-2xl font-semibold'>Test Bank</Text>
                    <Octicons name="filter" size={27} color="black" />
                </View>
                {/* Exam List */}


                <ScrollView
                    onScroll={handleScroll}
                    scrollEventThrottle={400}
                    bounces={false}
                >
                    <View className={` ${testCards.length === 0 && "h-screen"}`}>

                        {testCards.slice(3).map((testData, index) => (
                            <TestCard key={index} testData={testData} navigation={navigation} />
                        ))}

                        <View className={`justify-center h-32 items-center ${testCards.length === 0 && "h-[70%]"}`}>
                            {loading && (
                                <ActivityIndicator className="pb-12" size={"large"} />
                            )}
                        </View>
                    </View>

                </ScrollView>


            </View >
        </SafeAreaView >
    )
}

export default TestBank