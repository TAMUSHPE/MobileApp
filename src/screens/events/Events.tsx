import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/core';
import { Octicons, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../config/firebaseConfig';
import { getUpcomingEvents, getPastEvents, getUser, getCommittees } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { Images } from '../../../assets';
import { formatTime } from '../../helpers/timeUtils';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { EventsStackParams } from '../../types/navigation';
import { EventType, ExtendedEventType, SHPEEvent } from '../../types/events';
import EventCard from './EventCard';
import { Committee } from '../../types/committees';

const Events = ({ navigation }: EventsProps) => {
    const route = useRoute<EventsScreenRouteProp>();
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;


    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const filterScrollViewRef = useRef<ScrollView>(null);
    const committeeScrollViewRef = useRef<ScrollView>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [todayEvents, setTodayEvents] = useState<SHPEEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<SHPEEvent[]>([]);
    const [pastEvents, setPastEvents] = useState<SHPEEvent[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<ExtendedEventType | null>(route.params?.filter || null);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [selectedCommittee, setSelectedCommittee] = useState<string | null>(route.params?.committee || null);

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const fetchEvents = async () => {
        try {
            setIsLoading(true);

            const upcomingEventsData = await getUpcomingEvents();
            const pastEventsData = await getPastEvents(3, null);

            const currentTime = new Date();
            const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
            const todayEvents = upcomingEventsData.filter(event => {
                const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                return startTime >= today && startTime < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });
            const upcomingEvents = upcomingEventsData.filter(event => {
                const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                return startTime >= new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });

            setTodayEvents(todayEvents);
            setUpcomingEvents(upcomingEvents);
            setPastEvents(pastEventsData.events);

            setIsLoading(false);
        } catch (error) {
            console.error('An error occurred while fetching events:', error);
            setIsLoading(false);
        }
    };

    const fetchUserData = async () => {
        console.log("Fetching user data...");
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            if (firebaseUser) {
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            }
            else {
                console.warn("User data undefined. Data was likely deleted from Firebase.");
            }
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    const fetchCommittees = async () => {
        const committeeData = await getCommittees();
        setCommittees(committeeData);
    };


    useEffect(() => {
        fetchEvents();
        fetchUserData();
        fetchCommittees();
    }, [])

    useEffect(() => {
        if (route.params?.filter !== undefined) {
            setSelectedFilter(route.params.filter);

            const filterIndex = ["myEvents", "clubWide", ...Object.values(EventType)].indexOf(route.params.filter);
            if (filterIndex !== -1 && filterScrollViewRef.current) {
                const scrollPosition = filterIndex * 115;
                filterScrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
            }
        }

        if (route.params?.committee !== undefined) {
            setSelectedCommittee(route.params.committee);

            const committeeIndex = committees.findIndex(committee => committee.firebaseDocName === route.params.committee);
            if (committeeIndex !== -1 && committeeScrollViewRef.current) {
                const scrollPosition = committeeIndex * 100;
                committeeScrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
            }
        }
    }, [route.params, committees]);

    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchEvents();
            }
        }, [hasPrivileges])
    );

    const handleFilterSelect = (filter?: ExtendedEventType, committee?: string) => {
        // Deselect committee when the same committee is selected
        if (committee) {
            if (selectedCommittee === committee) {
                setSelectedCommittee(null);
                if (!selectedFilter) {
                    setSelectedFilter(null);
                }
            } else {
                setSelectedCommittee(committee);
                if (selectedFilter !== EventType.COMMITTEE_MEETING) {
                    setSelectedFilter(EventType.COMMITTEE_MEETING);
                }
            }
            return;
        }

        // Deselect "Committee Meetings" when no committee is selected
        if (filter === EventType.COMMITTEE_MEETING && selectedFilter === EventType.COMMITTEE_MEETING) {
            setSelectedFilter(null);
            setSelectedCommittee(null);
            return;
        }

        // Handle other filters
        if (selectedFilter === filter) {
            setSelectedFilter(null);
            setSelectedCommittee(null);
        } else {
            setSelectedFilter(filter!);
            setSelectedCommittee(null);
        }
    };

    const filteredEvents = (events: SHPEEvent[]): SHPEEvent[] => {
        // If no filter is selected, filter out hidden events and committee meetings
        if (!selectedFilter) {
            return events.filter(event =>
                (event.eventType !== EventType.COMMITTEE_MEETING || event.general) &&
                !event.hiddenEvent
            );
        }

        if (selectedFilter === 'myEvents') {
            return events.filter(event =>
                (userInfo?.publicInfo?.committees?.includes(event.committee || '') ||
                    userInfo?.publicInfo?.interests?.includes(event.eventType || '')) &&
                !event.hiddenEvent
            );
        }

        if (selectedFilter === 'clubWide') {
            return events.filter(event => event.general && !event.hiddenEvent);
        }
        // Show hidden events for "Custom Event" filter
        if (selectedFilter === 'Custom Event') {
            return events.filter(event => event.eventType === selectedFilter);
        }

        if (selectedFilter === EventType.COMMITTEE_MEETING) {
            return events.filter(event =>
                event.eventType === EventType.COMMITTEE_MEETING &&
                (selectedCommittee ? event.committee === selectedCommittee : true) &&
                !event.hiddenEvent
            );
        }

        return events.filter(event => event.eventType === selectedFilter && !event.hiddenEvent);
    };

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row px-4'>
                    <Text className={`text-4xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Events</Text>
                </View>

                {/* Filters */}
                <ScrollView
                    className='pt-3 pb-2'
                    showsHorizontalScrollIndicator={false}
                    horizontal={true}
                    ref={filterScrollViewRef}
                >
                    <View className='flex-row px-4 space-x-3'>
                        <TouchableOpacity
                            className={`flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectedFilter === "myEvents" && 'bg-primary-blue border-primary-blue'}`}
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
                            onPress={() => handleFilterSelect("myEvents")}
                        >
                            <Text className={`font-bold ${selectedFilter === "myEvents" ? 'text-white' : `${darkMode ? "text-white" : "text-black"}`}`}>My Events</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectedFilter === "clubWide" && 'bg-primary-blue border-primary-blue'}`}
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
                            onPress={() => handleFilterSelect("clubWide")}
                        >
                            <Text className={`font-bold ${selectedFilter === "clubWide" ? 'text-white' : `${darkMode ? "text-white" : "text-black"}`}`}>Club Wide</Text>
                        </TouchableOpacity>

                        {Object.values(EventType).map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectedFilter === type && 'bg-primary-blue border-primary-blue'}`}
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
                                onPress={() => handleFilterSelect(type)}
                            >
                                <Text className={`font-bold ${selectedFilter === type ? 'text-white' : `${darkMode ? "text-white" : "text-black"}`}`}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Additional Committee Filter */}
                {selectedFilter === EventType.COMMITTEE_MEETING && (
                    <ScrollView horizontal={true} className='pt-3 pb-2' showsHorizontalScrollIndicator={false} ref={committeeScrollViewRef}>
                        <View className='flex-row px-4 space-x-3'>
                            {committees.map(committee => (
                                <TouchableOpacity
                                    key={committee.firebaseDocName}
                                    className={`flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectedCommittee === committee.firebaseDocName && 'bg-primary-blue border-primary-blue'}`}
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
                                    onPress={() => handleFilterSelect(undefined, committee.firebaseDocName)}
                                >
                                    <Text className={`font-bold ${selectedCommittee === committee.firebaseDocName ? 'text-white' : `${darkMode ? "text-white" : "text-black"}`}`}>{committee.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                )}

                {isLoading &&
                    <View className='mt-10 justify-center items-center'>
                        <ActivityIndicator size="small" />
                    </View>
                }

                {/* Event Listings */}
                {!isLoading && (
                    <View className='px-4'>
                        {filteredEvents(todayEvents).length === 0 && filteredEvents(upcomingEvents).length === 0 && filteredEvents(pastEvents).length === 0 ? (
                            <View className='mt-10 justify-center items-center'>
                                <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>No Events</Text>
                            </View>
                        ) : (
                            <View>
                                {/* Today's Events */}
                                {filteredEvents(todayEvents).length !== 0 && (
                                    <View className='mt-8'>
                                        <Text className={`mb-3 text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Today's Events</Text>
                                        {filteredEvents(todayEvents)?.map((event: SHPEEvent, index) => {
                                            return (
                                                <TouchableOpacity
                                                    key={event.id}
                                                    className={`h-32 rounded-md ${index > 0 && "mt-8"}`}
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
                                                    onPress={() => { navigation.navigate("EventInfo", { event: event }) }}
                                                >
                                                    <Image
                                                        className="flex h-full w-full rounded-2xl"
                                                        resizeMode='cover'
                                                        defaultSource={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                                                        source={event?.coverImageURI ? { uri: event.coverImageURI } : darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                                                    />
                                                    <LinearGradient
                                                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                                                        className='absolute bottom-0 h-[70%] w-full rounded-b-lg justify-center'
                                                    >
                                                        <View className='px-4 pt-6'>
                                                            <Text className='text-xl font-bold text-white'>{truncateStringWithEllipsis(event.name, 20)}</Text>
                                                            {event.locationName ? (
                                                                <Text className='text-md font-semibold text-white'>{truncateStringWithEllipsis(event.locationName, 24)}</Text>
                                                            ) : null}
                                                            <Text className='text-md font-semibold text-white'>{formatTime(event.startTime?.toDate()!)}</Text>
                                                        </View>
                                                    </LinearGradient>
                                                    {hasPrivileges && (
                                                        <TouchableOpacity
                                                            onPress={() => { navigation.navigate("QRCode", { event: event }) }}
                                                            className='absolute right-0 top-0 p-2 m-2 rounded-full'
                                                            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                                                        >
                                                            <FontAwesome6 name="qrcode" size={24} color="white" />
                                                        </TouchableOpacity>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Upcoming Events */}
                                {filteredEvents(upcomingEvents).length !== 0 && (
                                    <View className='mt-8'>
                                        <Text className={`mb-3 text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Upcoming Events</Text>
                                        {filteredEvents(upcomingEvents)?.map((event: SHPEEvent, index) => {
                                            return (
                                                <View key={event.id} className={`${index > 0 && "mt-8"}`}>
                                                    <EventCard event={event} navigation={navigation} />
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Past Events */}
                                {filteredEvents(pastEvents).length !== 0 && (
                                    <View className='mt-8'>
                                        <Text className={`mb-3 text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Past Events</Text>
                                        {filteredEvents(pastEvents)?.map((event: SHPEEvent, index) => {
                                            return (
                                                <View key={index} className={`${index > 0 && "mt-8"}`}>
                                                    <EventCard event={event} navigation={navigation} />
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                                {!selectedFilter && (
                                    <TouchableOpacity onPress={() => navigation.navigate("PastEvents")}>
                                        <Text className='text-xl text-primary-blue mt-8 underline'>View more</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View className='pb-24' />
            </ScrollView>

            {/* Create Event */}
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
                    onPress={() => navigation.navigate("CreateEvent")}
                >
                    <Octicons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

type EventsProps = {
    filter?: ExtendedEventType;
    committee?: string;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

type EventsScreenRouteProp = RouteProp<EventsStackParams, "EventsScreen">;


export default Events;
