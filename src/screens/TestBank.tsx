import { View, Text, TouchableHighlight, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TextInput, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GoogleSheetsIDs, queryGoogleSpreadsheet } from '../api/fetchGoogleSheets';
import TestCard from '../components/TestCard';
import { ResourcesStackParams } from '../types/Navigation';
import { Test, GoogleSheetsResponse } from '../types/GoogleSheetsTypes';

/**
 * Test Bank component.
 * Allows users to browse and filter tests.
 * 
 * @param props - React navigation properties.
 */
const TestBank = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const [testCards, setTestCards] = useState<Test[]>([])
    const [loading, setLoading] = useState(true);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filter, setFilter] = useState<Test | null>(null);
    const [query, setQuery] = useState<string | undefined>(undefined);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const [endOfData, setEndOfData] = useState(false);

    /** On mount, load attempt to load the first 50 tests */
    useEffect(() => {
        const initialQuery = createQuery(50, 0, filter);
        setQuery(initialQuery)
    }, [])

    /**
    * Creates a query to fetch test data from a Google Sheet.
    * 
    * @param limit - The maximum number of tests to fetch. If null, no limit is applied.
    * @param offset - The position to start fetching tests from.
    * @param filter - An object containing filter criteria. If null, no filtering is applied.
    * @returns The constructed query.
    */
    const createQuery = (limit: number | null, offset: number, filter: Test | null) => {
        let query = `SELECT A, B, C, D, E, F, G, H, J, K`;

        let conditions = [];
        if (filter?.subject) {
            const subjectWithoutSpaces = filter?.subject.replace(/\s+/g, '');
            conditions.push(`LOWER(A) CONTAINS '${subjectWithoutSpaces.toLowerCase()}'`)
        }
        if (filter?.course) {
            const courseWithoutSpaces = filter?.course.replace(/\s+/g, '');
            conditions.push(`LOWER(B) CONTAINS '${courseWithoutSpaces.toLowerCase()}'`)
        }
        if (filter?.professor) {
            conditions.push(`LOWER(G) CONTAINS '${filter?.professor.toLowerCase()}'`)
        }
        if (filter?.student) {
            conditions.push(`LOWER(H) CONTAINS '${filter?.student.toLowerCase()}'`)
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        const limitClause = limit !== null ? `LIMIT ${limit}` : "";
        query += ` ${limitClause} OFFSET ${offset}`;

        return query;

    }

    /**
     * Prepares the test data by transforming the Google Sheets response into a more usable format.
     * 
     * @param data - The Google Sheets response data.
     * @returns A promise that resolves to an array of tests.
     */
    const prepTestSheet = async (data: GoogleSheetsResponse): Promise<Test[]> => {
        const dataRow = data.table?.rows;
        if (!dataRow || dataRow?.length === 0) {
            setEndOfData(true);
            return [];
        }
        const testsDataPromises = dataRow
            .filter(entry => entry.c[0] && entry.c[1])
            .map(async (entry, index) => {
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

        return await Promise.all(testsDataPromises);
    }

    const queryAndSetTests = async (query: string) => {
        queryGoogleSpreadsheet(GoogleSheetsIDs.TEST_BANK_ID, query, "Database")
            .then(response => {
                setLoading(true);
                return prepTestSheet(response!)
            }).then(data => {
                setTestCards([...testCards, ...data]);
            })
            .catch(error => {
                console.error("Failed to fetch data:", error);
            }).finally(() => {
                setLoading(false);

                // Reset the query and filter
                setQuery(undefined);
                setFilter(null);

            })
    }

    /** When the query changes, fetch the data from the Google Spreadsheet. */
    useEffect(() => {
        if (query) {
            queryAndSetTests(query);
        }
    }, [query])

    const handleApplyFilter = async (): Promise<void> => {
        // Reset the test bank
        setShowFilterMenu(false)
        setLoading(true);
        setTestCards([])

        // If no filter is applied, rest the query to fetch the first 50 tests
        // If filter is applied, fetch all tests that match the filter
        const filterQuery = filter === null ? createQuery(50, 0, {}) : createQuery(null, 0, filter);
        setEndOfData(true);
        setQuery(filterQuery);
    }

    const handleCLearFilter = async (): Promise<void> => {
        // Reset the test bank
        setShowFilterMenu(false)
        setLoading(true);
        setTestCards([])
        setFilter(null)

        const initialQuery = createQuery(50, 0, null);
        setQuery(initialQuery)
    }

    const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!isCloseToBottom(nativeEvent)) return;
        if (filter || endOfData) return;
        setLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            const loadMoreTestsQuery = createQuery(20, testCards.length, filter);
            setQuery(loadMoreTestsQuery);
            debounceTimer.current = null;
        }, 300);
    };

    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    return (
        <SafeAreaView
            className='bg-red-orange h-full pt-7'
            edges={['right', 'top', 'left']}
        >
            {/* Header */}
            < View className={`bg-offwhite ${testCards.length === 0 && "h-screen"}`} >
                <View className='flex-row items-center justify-between px-6 mt-4 pt-4 pb-2'>
                    <TouchableHighlight onPress={() => navigation.goBack()} underlayColor="offwhite">
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableHighlight>
                    <Text className='text-2xl font-semibold'>Test Bank</Text>

                    <TouchableHighlight onPress={() => setShowFilterMenu(!showFilterMenu)} underlayColor="offwhite">
                        <Octicons name="filter" size={27} color="black" />
                    </TouchableHighlight>
                </View>
                {showFilterMenu && (
                    <View className='flex-row p-4'>
                        <View className='flex-1 space-y-4'>
                            <View className='justify-start flex-row'>
                                <TextInput
                                    value={filter?.subject}
                                    onChangeText={(text) => setFilter({ ...filter, subject: text })}
                                    placeholder="Subject"
                                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />
                                <TextInput
                                    value={filter?.course}
                                    onChangeText={(text) => setFilter({ ...filter, course: text })}
                                    placeholder="Course"
                                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2'
                                />
                            </View>
                            <View className='justify-start  flex-row'>
                                <TextInput
                                    value={filter?.professor}
                                    onChangeText={(text) => setFilter({ ...filter, professor: text })}
                                    placeholder="Professor"
                                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />
                                <TextInput
                                    value={filter?.student}
                                    onChangeText={(text) => setFilter({ ...filter, student: text })}
                                    placeholder="Student"
                                    className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2'
                                />
                            </View>
                        </View>
                        <View>

                            <TouchableOpacity
                                onPress={() => handleApplyFilter()}
                                className='items-center justify-center bg-pale-blue w-14 h-10 rounded-lg'>
                                <Text className='text-bold text-xl'>Apply</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleCLearFilter()}
                                className='items-center justify-center bg-red-600 w-14 h-10 rounded-lg'>
                                <Text className='text-bold text-xl'>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                {/* Exam List */}

                <ScrollView
                    onScroll={handleScroll}
                    scrollEventThrottle={400}
                    bounces={false}
                    className='h-full'
                >
                    <View className={`${testCards.length === 0 && "h-screen"}`}>
                        {testCards.slice(3).map((testData, index) => (
                            <View key={index}>
                                {(testData.course && testData.subject) && (
                                    <TestCard testData={testData} navigation={navigation} />
                                )}
                            </View>
                        ))}

                        <View className={`justify-center ${testCards.length < 5 ? "h-100" : "h-32"} items-center mb-6 ${testCards.length === 0 && "h-[70%]"} `}>
                            {loading && (
                                <ActivityIndicator className="pb-12" size={"large"} />
                            )}
                            {endOfData && (
                                <View className='pb-12 items-center justify-center'>
                                    <Text>
                                        End of Test Bank
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View >
        </SafeAreaView >
    )
}

export default TestBank