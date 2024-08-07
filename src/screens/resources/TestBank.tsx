import { View, Text, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, useColorScheme, Modal } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GoogleSheetsIDs, queryGoogleSpreadsheet } from '../../api/fetchGoogleSheets';
import { UserContext } from '../../context/UserContext';
import { ResourcesStackParams } from '../../types/navigation';
import { Test, GoogleSheetsResponse } from '../../types/googleSheetsTypes';
import { SUBJECTCODES } from '../../types/testBank';
import TestCard from './TestCard';

/**
 * Test Bank component.
 * Allows users to browse and filter tests.
 * 
 * @param props - React navigation properties.
 */
const TestBank = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const insets = useSafeAreaInsets();

    const [testCards, setTestCards] = useState<Test[]>([])
    const [filter, setFilter] = useState<Test | null>(null);
    const [query, setQuery] = useState<string | undefined>(undefined);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [endOfData, setEndOfData] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const initialQuery = createQuery(20, 0, filter);
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

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        const limitClause = limit !== null ? `LIMIT ${limit}` : "";
        query += ` ${limitClause} OFFSET ${offset}`;

        return query;

    }

    const normalizeData = (entry: any): Test => {
        return {
            subject: entry.c[0]?.v?.toString() ?? '',
            course: entry.c[1]?.f ?? '',
            semester: entry.c[2]?.v?.toString() ?? '',
            year: entry.c[3]?.v?.toString() ?? '',
            testType: entry.c[4]?.v?.toString() ?? '',
            typeNumber: entry.c[5]?.f ?? '',
            professor: entry.c[6]?.v?.toString() ?? '',
            student: entry.c[7]?.v?.toString() ?? '',
            grade: entry.c[8]?.v?.toString() ?? '',
            testURL: entry.c[9]?.v ?? '',
        };
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
        const testsData = dataRow
            .filter(entry => entry.c[0] && entry.c[1])
            .map(normalizeData);

        return testsData;
    }

    const queryAndSetTests = async (query: string) => {
        try {
            const response = await queryGoogleSpreadsheet(GoogleSheetsIDs.TEST_BANK_ID, query, "Database");
            if (!response) throw new Error("No response from Google Sheets API");

            const data = await prepTestSheet(response);
            setTestCards([...testCards, ...data]);

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
            setQuery(undefined);
        }
    }

    /** When the query changes, fetch the data from the Google Spreadsheet. */
    useEffect(() => {
        if (query) {
            queryAndSetTests(query);
        }
    }, [query])

    const handleApplyFilter = async (filter: Test | null): Promise<void> => {
        setLoading(true);
        setTestCards([])

        // Apply the filter
        const filterQuery = filter === null ? createQuery(20, 0, {}) : createQuery(null, 0, filter);
        setEndOfData(true);
        setQuery(filterQuery);
    }

    const handleClearFilter = async (): Promise<void> => {
        // Reset the test bank
        setLoading(true);
        setTestCards([])
        setFilter(null)

        const initialQuery = createQuery(20, 0, null);
        setQuery(initialQuery)
    }

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;
        }

        if (!isCloseToBottom(nativeEvent)) return;
        if (filter || endOfData) return;
        setLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            const loadMoreTestsQuery = createQuery(15, testCards.length, filter);
            setQuery(loadMoreTestsQuery);
            debounceTimer.current = null;
        }, 300);
    }, [filter, endOfData, testCards.length, setQuery]);

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center justify-between'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Test Bank</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            <View className='flex-row justify-between items-center mx-4 mt-2'>
                {filter ? (
                    <TouchableOpacity
                        className={`flex-row items-center px-3 py-2 ${darkMode ? "bg-grey-dark" : "bg-grey-light"} rounded-lg`}
                        onPress={() => handleClearFilter()}
                    >
                        <Octicons name="x" size={20} color={darkMode ? "white" : "black"} />
                        <Text className={`ml-2 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{filter.subject}</Text>
                    </TouchableOpacity>
                ) : (<View />)}
                <TouchableOpacity
                    onPress={() => { setShowFilterModal(true) }}
                    className='mx-c4 p-2'
                >
                    <Octicons name="filter" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            <ScrollView
                className='mt-4 -z-10'
                onScroll={handleScroll}
            >
                {testCards.map((testData, index) => (
                    <View key={index}>
                        {(testData.course && testData.subject) && (
                            <TestCard testData={testData} navigation={navigation} />
                        )}
                    </View>
                ))}

                <View className='mt-12'>
                    {loading && (
                        <ActivityIndicator className="pb-12" size={"small"} />
                    )}
                    {(!loading && testCards.length != 0 && endOfData) && (
                        <View className='pb-12 items-center justify-center'>
                            <Text>
                                End of Test Bank
                            </Text>
                        </View>
                    )}
                    {!loading && testCards.length === 0 && (
                        <View className='flex justify-center items-center'>
                            <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>No Test Found</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showFilterModal}
                onRequestClose={() => { setShowFilterModal(false); }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? 'text-white' : 'text-black'}`}>Select Filter</Text>
                        </View>

                        <TouchableOpacity
                            className='px-4'
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Octicons name="x" size={26} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        <View>
                            <Text className={`text-2xl font-bold mb-4 mx-4 ${darkMode ? "text-white" : "text-black"}`}>Subjects</Text>
                            <View className='flex-row flex-wrap ml-4'>
                                {SUBJECTCODES.map(({ iso }) => (
                                    <TouchableOpacity
                                        key={iso}
                                        onPress={() => {
                                            if (filter?.subject === iso) {
                                                setFilter(null);
                                                handleApplyFilter(null);
                                                setShowFilterModal(false);
                                            } else {
                                                setFilter({ ...filter, subject: iso });
                                                handleApplyFilter({ ...filter, subject: iso });
                                                setShowFilterModal(false);
                                            }
                                        }}
                                        className={`px-4 py-2 mr-3 mb-4 rounded-md ${filter?.subject === iso ? 'bg-primary-blue' : (darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light')}`}

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
                                    >
                                        <Text className={`text-lg font-semibold ${filter?.subject === iso ? "text-white" : (darkMode ? 'text-white' : 'text-black')}`}>{iso}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default TestBank