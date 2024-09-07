import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, useColorScheme, TextInput } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from '@react-navigation/core'
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../context/UserContext'
import { auth } from '../../config/firebaseConfig';
import { fetchAndStoreUser, getCommitteeEvents, getCommitteeMeetings, getCommittees } from '../../api/firebaseUtils'
import { Committee } from "../../types/committees"
import CommitteeCard from './CommitteeCard'
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommitteesStackParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SHPEEvent } from '../../types/events';

const Committees = ({ navigation }: NativeStackScreenProps<CommitteesStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const [committees, setCommittees] = useState<CommitteeWithCount[]>([]);
    const [filteredCommittees, setFilteredCommittees] = useState<CommitteeWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState<string>("");

    const inputRef = useRef<TextInput>(null);

    const countCommitteeMeetings = (committees: Committee[], events: SHPEEvent[]) => {
        const meetingCounts: { [key: string]: number } = {};

        committees.forEach((committee) => {
            if (committee.firebaseDocName) {
                meetingCounts[committee.firebaseDocName] = 0;
            }
        });

        events.forEach((event) => {
            const committeeName = event.committee;

            if (committeeName && meetingCounts.hasOwnProperty(committeeName)) {
                meetingCounts[committeeName] += 1;
            }
        });

        return meetingCounts;
    };



    const fetchCommittees = async () => {
        setIsLoading(true);
        const committeesRes = await getCommittees();
        const meetingsRes = await getCommitteeMeetings() as SHPEEvent[];

        // Get the count of meetings for each committee
        const meetingCounts = countCommitteeMeetings(committeesRes, meetingsRes);

        const userCommittees = userInfo?.publicInfo?.committees || [];

        // Sort committees based on user membership and member count
        const sortedCommittees = committeesRes.map((committee) => {
            // Attach event count to each committee
            const eventCount = meetingCounts[committee.firebaseDocName!] || 0;
            return { ...committee, eventCount };
        }).sort((a, b) => {
            const isUserInA = userCommittees.includes(a.firebaseDocName!);
            const isUserInB = userCommittees.includes(b.firebaseDocName!);

            if (isUserInA && !isUserInB) return -1;
            if (!isUserInA && isUserInB) return 1;
            return (b.memberCount || 0) - (a.memberCount || 0);
        });

        setCommittees(sortedCommittees);
        setFilteredCommittees(sortedCommittees);
        setIsLoading(false);
    };

    const updateFilteredCommittees = (searchQuery: string) => {
        const filtered = committees.filter(committee =>
            committee.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCommittees(filtered);
    };


    useEffect(() => {
        const fetchUserData = async () => {
            const firebaseUser = await fetchAndStoreUser();
            if (firebaseUser) {
                setUserInfo(firebaseUser);
            }
        };

        fetchCommittees();
        fetchUserData();
    }, []);

    useEffect(() => {
        updateFilteredCommittees(search);
    }, [search, committees]);

    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchCommittees();
            }
        }, [hasPrivileges])
    );

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row px-4'>
                    <Text className={`text-4xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Committees</Text>
                </View>

                {/* Search */}
                <View className='px-4'>
                    <View className='flex-row mt-8'>
                        <TouchableOpacity
                            activeOpacity={1}
                            className={`rounded-xl px-4 py-2 flex-row flex-1 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
                            onPress={() => { inputRef.current?.focus() }}
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
                            <View className='mr-3'>
                                <Octicons name="search" size={24} color={darkMode ? "white" : "black"} />
                            </View>
                            <TextInput
                                style={{ textAlignVertical: 'top', color: darkMode ? 'white' : 'black' }}
                                onChangeText={(text) => {
                                    setSearch(text);
                                }}
                                ref={inputRef}
                                value={search}
                                underlineColorAndroid="transparent"
                                placeholder="Search Committees"
                                placeholderTextColor={"grey"}
                                className='flex-1 text-lg justify-center'
                            />
                        </TouchableOpacity>
                    </View>
                </View>


                {isLoading &&
                    <View className='mt-10 justify-center items-center'>
                        <ActivityIndicator size="small" />
                    </View>
                }

                {/* Committees Listing */}
                <View className='flex-row flex-wrap mt-10 mx-4 justify-between'>
                    {filteredCommittees.map((committee, index) => (
                        <View key={index} className='w-[46%]'>
                            <CommitteeCard
                                committee={committee}
                                navigation={navigation}
                                eventCount={committee.eventCount || 0}
                            />
                        </View>
                    ))}
                </View>

                <View className='pb-24' />
            </ScrollView>

            {/* Create Committee */}
            {hasPrivileges && (
                <TouchableOpacity
                    className='absolute bottom-0 right-0 bg-primary-blue rounded-full h-14 w-14 shadow-lg justify-center items-center m-4'
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
                    onPress={() => navigation.navigate("CommitteeEditor", { committee: undefined })}
                >
                    <Octicons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    )
}

interface CommitteeWithCount extends Committee {
    eventCount: number;
}

export default Committees;
