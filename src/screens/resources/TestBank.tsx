import { View, Text, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TextInput, TouchableOpacity } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { GoogleSheetsIDs, queryGoogleSpreadsheet } from '../../api/fetchGoogleSheets';
import { ResourcesStackParams } from '../../types/Navigation';
import { Test, GoogleSheetsResponse } from '../../types/GoogleSheetsTypes';
import DismissibleModal from '../../components/DismissibleModal';
import TestCard from './TestCard';
import CustomDropDownMenu, { CustomDropDownMethods } from '../../components/CustomDropDown';
import { SUBJECTCODES } from '../../types/testBank';

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
    const [infoVisible, setInfoVisible] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropDownRefSubject = useRef<CustomDropDownMethods>(null);

    /** On mount, load attempt to load the first 20 tests */
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
        setLoading(true);
        setTestCards([])

        // If no filter is applied, rest the query to fetch the first 50 tests
        // If filter is applied, fetch all tests that match the filter
        const filterQuery = filter === null ? createQuery(20, 0, {}) : createQuery(null, 0, filter);
        setEndOfData(true);
        setQuery(filterQuery);
    }

    const handleCLearFilter = async (): Promise<void> => {
        // Reset the test bank
        handleClearAllSelections();
        setLoading(true);
        setTestCards([])
        setFilter(null)

        const initialQuery = createQuery(20, 0, null);
        setQuery(initialQuery)
    }

    const handleClearAllSelections = () => {
        dropDownRefSubject.current?.clearSelection();
    };

    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
    };


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
            const loadMoreTestsQuery = createQuery(20, testCards.length, filter);
            setQuery(loadMoreTestsQuery);
            debounceTimer.current = null;
        }, 300);
    }, [filter, endOfData, testCards.length, setQuery]);

    return (
        <View className='flex-1 bg-pale-blue'>
            {/* Header */}
            <SafeAreaView edges={['top']} >
                <View className='flex-row justify-between items-center mx-5 mt-1'>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>
                    <Text className='text-2xl font-semibold text-white'>Test Bank</Text>

                    <TouchableOpacity onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View className='bg-[#F9F9F9] mt-12 rounded-t-2xl flex-1'>
                <View className='flex-row justify-start'>
                    <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='my-2 mx-4 p-2'
                    >
                        {showFilterMenu ? (
                            <View className='flex-row items-center space-x-4'>
                                <Octicons name="x" className='bg-red-600' size={30} color="black" />
                                <Text className='font-semibold text-xl'>Filters</Text>
                            </View>
                        ) : (
                            <Octicons name="filter" className='bg-blue' size={30} color="black" />
                        )}
                    </TouchableOpacity>
                </View>

                {showFilterMenu && (
                    <View className='flex-row px-4'>
                        <View className='flex-1 space-y-4'>
                            <View className='justify-start flex-row z-10'>
                                <CustomDropDownMenu
                                    data={SUBJECTCODES}
                                    onSelect={(item) => setFilter({ ...filter, subject: item.iso || "" })}
                                    searchKey="subject"
                                    label="Subject"
                                    isOpen={openDropdown === 'subject'}
                                    onToggle={() => toggleDropdown('subject')}
                                    displayType='iso'
                                    ref={dropDownRefSubject}
                                    containerClassName='mr-1'
                                />
                                <TextInput
                                    value={filter?.course}
                                    onChangeText={(text) => setFilter({ ...filter, course: text })}
                                    placeholder="Course"
                                    className='flex-1 bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-1 ml-1'
                                />
                                <TouchableOpacity
                                    onPress={() => handleApplyFilter()}
                                    className='items-center justify-center bg-pale-blue py-2 w-20 rounded-lg ml-3'>
                                    <Text className='text-white font-bold text-xl'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-start flex-row'>
                                <TextInput
                                    value={filter?.professor}
                                    onChangeText={(text) => setFilter({ ...filter, professor: text })}
                                    placeholder="Professor"
                                    className='flex-1 bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 mr-1'
                                />
                                <TextInput
                                    value={filter?.student}
                                    onChangeText={(text) => setFilter({ ...filter, student: text })}
                                    placeholder="Student"
                                    className='flex-1 bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 ml-1'
                                />
                                <TouchableOpacity
                                    onPress={() => handleCLearFilter()}
                                    className='items-center justify-center py-2 w-20 rounded-lg ml-3'>
                                    <Text className='font-bold text-xl text-pale-blue'>Rest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <ScrollView className='mt-4 -z-10'>
                    {testCards.slice(3).map((testData, index) => (
                        <View key={index}>
                            {(testData.course && testData.subject) && (
                                <TestCard testData={testData} navigation={navigation} />
                            )}
                        </View>
                    ))}

                    <View className='mt-12'>
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
                </ScrollView>
            </View>

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'
                    style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color="black" />
                            <Text className='text-2xl font-semibold ml-2'>Resume FAQ</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text className='text-xl font-semibold'>What is the Test Bank?</Text>
                        <Text className='text-lg font-semibold text-gray-400'>Test Bank is...</Text>
                    </View>

                    <View>
                        <Text className='text-xl font-semibold'>Earning Points with Test Bank</Text>
                        <Text className='text-lg font-semibold text-gray-400'>Ways to earn points...</Text>
                    </View>

                </View>
            </DismissibleModal>
        </View>
    )
}

export default TestBank