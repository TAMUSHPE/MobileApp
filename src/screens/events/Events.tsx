import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { getUpcomingEvents, getPastEvents } from '../../api/firebaseUtils';
import { EventsStackParams } from '../../types/navigation';
import { EventType, SHPEEvent } from '../../types/events';
import EventsList from '../../components/EventsList';

const Events = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const [todayEvents, setTodayEvents] = useState<SHPEEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<SHPEEvent[]>([]);
    const [pastEvents, setPastEvents] = useState<SHPEEvent[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<ExtendedEventType | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [initialFetch, setInitialFetch] = useState(false);

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const handleFilterSelect = (filter: ExtendedEventType) => {
        if (selectedFilter === filter) {
            setSelectedFilter(null);
        } else {
            setSelectedFilter(filter);
        }
    };

    const filteredEvents = (events: SHPEEvent[]) => {
        if (!selectedFilter) {
            // By default, hide committee meetings unless they are labeled as general
            return events.filter(event => (event.eventType !== EventType.COMMITTEE_MEETING || event.general) && (event.hiddenEvent !== true));
        }
        if (selectedFilter === 'myEvents') {
            return events.filter(event =>
                userInfo?.publicInfo?.committees?.includes(event.committee || '') ||
                userInfo?.publicInfo?.interests?.includes(event.eventType || '')
            );
        }
        if (selectedFilter === 'clubWide') {
            return events.filter(event => event.general);
        }
        return events.filter(event => event.eventType === selectedFilter && (event.hiddenEvent !== true));
    };

    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                try {
                    setIsLoading(true);

                    const upcomingEventsData = await getUpcomingEvents();
                    const pastEventsData = await getPastEvents(5);

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
                    setPastEvents(pastEventsData);

                    setIsLoading(false);
                } catch (error) {
                    console.error('An error occurred while fetching events:', error);
                    setIsLoading(false);
                }
            };

            if (!initialFetch || hasPrivileges) {
                fetchEvents();
                setInitialFetch(true);
            }
        }, [hasPrivileges, initialFetch])
    );

    return (
        <SafeAreaView edges={["top"]} className='h-full'>
            <ScrollView>
                <View className='flex-row mt-4'>
                    <View className='w-full justify-center items-center'>
                        <Text className="text-3xl h-10">Events</Text>
                    </View>
                </View>

                {/* Filters */}
                <ScrollView horizontal={true} className='mt-3' showsHorizontalScrollIndicator={false}>
                    <View className='flex-row'>
                        {selectedFilter && (
                            <TouchableOpacity
                                className='flex-row items-center justify-center border border-red-400 rounded-md py-2 px-4 mx-2 mb-2'
                                onPress={() => setSelectedFilter(null)}
                            >
                                <Text className='font-bold text-red-400'>Reset</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            className={`flex-row items-center justify-center border rounded-md py-2 px-4 mx-2 mb-2 ${selectedFilter === "myEvents" ? 'bg-pale-blue' : 'border-pale-blue'}`}
                            onPress={() => handleFilterSelect("myEvents")}
                        >
                            <Text className={`font-bold ${selectedFilter === "myEvents" ? 'text-white' : 'text-pale-blue'}`}>My Events</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-row items-center justify-center border rounded-md py-2 px-4 mx-2 mb-2 ${selectedFilter === "clubWide" ? 'bg-pale-blue' : 'border-pale-blue'}`}
                            onPress={() => handleFilterSelect("clubWide")}
                        >
                            <Text className={`font-bold ${selectedFilter === "clubWide" ? 'text-white' : 'text-pale-blue'}`}>Club Wide</Text>
                        </TouchableOpacity>
                        {Object.values(EventType).map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-row items-center justify-center border rounded-md py-2 px-4 mx-2 mb-2 ${selectedFilter === type ? 'bg-pale-blue' : 'border-pale-blue'}`}
                                onPress={() => handleFilterSelect(type)}
                            >
                                <Text className={`font-bold ${selectedFilter === type ? 'text-white' : 'text-pale-blue'}`}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {isLoading &&
                    <View className='h-64 justify-center items-center'>
                        <ActivityIndicator size="large" />
                    </View>
                }

                {/* Event Listings */}
                {!isLoading && (
                    <View className='mx-5'>
                        {filteredEvents(todayEvents).length === 0 && filteredEvents(upcomingEvents).length === 0 && filteredEvents(pastEvents).length === 0 ? (
                            <View className='h-32 w-full justify-center items-center'>
                                <Text className='text-lg font-bold'>No Events</Text>
                            </View>
                        ) : (
                            <View>
                                {filteredEvents(todayEvents).length !== 0 && (
                                    <View>
                                        <Text className='text-xl mb-2 mt-8 font-bold'>Today Events</Text>
                                        <EventsList
                                            events={filteredEvents(todayEvents)}
                                            navigation={navigation}
                                        />
                                    </View>
                                )}

                                {filteredEvents(upcomingEvents).length !== 0 && (
                                    <View>
                                        <Text className='text-xl mb-2 mt-8 font-bold'>Upcoming Events</Text>
                                        <EventsList
                                            events={filteredEvents(upcomingEvents)}
                                            navigation={navigation}
                                        />
                                    </View>
                                )}

                                {filteredEvents(pastEvents).length !== 0 && (
                                    <View>
                                        <Text className='text-xl mb-2 mt-8 font-bold '>Past Events</Text>
                                        <EventsList
                                            events={filteredEvents(pastEvents)}
                                            navigation={navigation}
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View className='pb-20' />
            </ScrollView>

            {hasPrivileges && (
                <TouchableOpacity
                    className='absolute bottom-5 right-5 bg-pale-blue rounded-full h-16 w-16 shadow-lg justify-center items-center'
                    onPress={() => navigation.navigate("CreateEvent")}
                >
                    <Octicons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

type ExtendedEventType = EventType | 'myEvents' | 'clubWide';

export default Events;
