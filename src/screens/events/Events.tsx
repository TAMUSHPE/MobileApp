import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Octicons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserContext } from '../../context/UserContext';
import { getUpcomingEvents, getPastEvents } from '../../api/firebaseUtils';
import { EventsStackParams } from '../../types/navigation';
import { EventType, SHPEEvent } from '../../types/events';
import { Images } from '../../../assets';
import { formatTime } from '../../helpers/timeUtils';
import EventCard from './EventCard';

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

    const filteredEvents = (events: SHPEEvent[]): SHPEEvent[] => {
        // If no filter is selected, filter out hidden events
        if (!selectedFilter) {
            return events.filter(event =>
                (event.eventType !== EventType.COMMITTEE_MEETING || event.general) &&
                !event.hiddenEvent
            );
        }

        // Custom filter logic
        if (selectedFilter === 'myEvents') {
            return events.filter(event =>
                userInfo?.publicInfo?.committees?.includes(event.committee || '') ||
                userInfo?.publicInfo?.interests?.includes(event.eventType || '')
            );
        }
        if (selectedFilter === 'clubWide') {
            return events.filter(event => event.general);
        }

        // Show hidden events for "Custom Event" filter
        if (selectedFilter === 'Custom Event') {
            return events.filter(event => event.eventType === selectedFilter);
        }

        // Filter other events, excluding hidden ones
        return events.filter(event => event.eventType === selectedFilter && !event.hiddenEvent);
    };

    useFocusEffect(
        useCallback(() => {
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

            // Fetch events if user has privileges or if initial fetch has not been done
            if (!initialFetch || hasPrivileges) {
                fetchEvents();
                setInitialFetch(true);
            }
        }, [hasPrivileges, initialFetch])
    );

    return (
        <SafeAreaView edges={["top"]} className='h-full bg-white'>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className='px-4'>
                    <Text className="text-4xl font-bold">Events</Text>
                </View>

                {/* Filters */}
                <ScrollView bounces={false} horizontal={true} className='pt-3 pb-2' showsHorizontalScrollIndicator={false}>
                    <View className='flex-row px-4 space-x-3'>
                        <TouchableOpacity
                            className={`flex-row items-center justify-center rounded-md py-2 px-4 bg-offwhite ${selectedFilter === "myEvents" && 'bg-primary-blue border-primary-blue'}`}
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
                            <Text className={`font-bold ${selectedFilter === "myEvents" ? 'text-white' : 'text-black'}`}>My Events</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-row items-center justify-center rounded-md py-2 px-4 bg-offwhite ${selectedFilter === "clubWide" && 'bg-primary-blue border-primary-blue'}`}
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
                            <Text className={`font-bold ${selectedFilter === "clubWide" ? 'text-white' : 'text-black'}`}>Club Wide</Text>
                        </TouchableOpacity>

                        {Object.values(EventType).map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-row items-center justify-center rounded-md py-2 px-4 bg-offwhite ${selectedFilter === type && 'bg-primary-blue border-primary-blue'}`}
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
                                <Text className={`font-bold ${selectedFilter === type ? 'text-white' : 'text-black'}`}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

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
                                <Text className='text-lg font-bold'>No Events</Text>
                            </View>
                        ) : (
                            <View>
                                {/* Today's Events */}
                                {filteredEvents(todayEvents).length !== 0 && (
                                    <View className='mt-8'>
                                        <Text className='mb-3 text-2xl font-bold'>Today's Events</Text>
                                        {filteredEvents(todayEvents)?.map((event: SHPEEvent, index) => {
                                            return (
                                                <TouchableOpacity
                                                    key={event.id}
                                                    className={`h-32 rounded-md ${index > 0 && "mt-8"}`}
                                                    onPress={() => { navigation.navigate("EventInfo", { eventId: event.id! }) }}
                                                >
                                                    <Image
                                                        className="flex h-full w-full rounded-2xl"
                                                        resizeMode='cover'
                                                        defaultSource={Images.SHPE_NAVY_HORIZ}
                                                        source={event?.coverImageURI ? { uri: event.coverImageURI } : Images.SHPE_NAVY_HORIZ}
                                                    />
                                                    <LinearGradient
                                                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                                                        className='absolute bottom-0 h-[70%] w-full rounded-b-lg justify-center'
                                                    >
                                                        <View className='px-4 pt-6'>
                                                            <Text className='text-xl font-bold text-white'>{event.name}</Text>
                                                            {event.locationName ? (
                                                                <Text className='text-md font-semibold text-white'>{event.locationName}</Text>
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
                                        <Text className='mb-3 text-2xl font-bold'>Upcoming Events</Text>
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
                                        <Text className='mb-3 text-2xl font-bold'>Past Events</Text>
                                        {filteredEvents(pastEvents)?.map((event: SHPEEvent, index) => {
                                            return (
                                                <View key={index} className={`${index > 0 && "mt-8"}`}>
                                                    <EventCard event={event} navigation={navigation} />
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                                <TouchableOpacity onPress={() => navigation.navigate("PastEvents")}>
                                    <Text className='text-xl text-primary-blue mt-8 underline'>View all past events</Text>
                                </TouchableOpacity>
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

type ExtendedEventType = EventType | 'myEvents' | 'clubWide';

export default Events;
