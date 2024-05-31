import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { getUpcomingEvents, getPastEvents } from '../../api/firebaseUtils';
import { EventsStackParams } from '../../types/Navigation';
import { EventType, SHPEEvent } from '../../types/Events';
import EventsList from '../../components/EventsList';

const Events = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const [currentEvents, setCurrentEvents] = useState<SHPEEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<SHPEEvent[]>([]);
    const [pastEvents, setPastEvents] = useState<SHPEEvent[]>([]);
    const [allPastEvents, setAllPastEvents] = useState<SHPEEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pastEventModalVisible, setPastEventModalVisible] = useState(false);
    const [initialFetch, setInitialFetch] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<EventType | null>(null);

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const insets = useSafeAreaInsets();

    const handleFilterSelect = (filter: EventType) => {
        if (selectedFilter === filter) {
            setSelectedFilter(null);
        } else {
            setSelectedFilter(filter);
        }
    };

    const filteredEvents = (events: SHPEEvent[]) => {
        if (!selectedFilter) {
            // By default, hide committee meetings because they may increase clutter
            return events.filter(event => event.eventType !== EventType.COMMITTEE_MEETING && (event.hiddenEvent !== true));
        }
        return events.filter(event => event.eventType === selectedFilter && (event.hiddenEvent !== true));
    };
    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                try {
                    setIsLoading(true);

                    const upcomingEventsData = await getUpcomingEvents();
                    const pastEventsData = await getPastEvents(8);

                    // Filter to separate current and upcoming events
                    const currentTime = new Date();
                    const currentEvents = upcomingEventsData.filter(event => {
                        const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                        const endTime = event.endTime ? event.endTime.toDate() : new Date(0);
                        return startTime <= currentTime && endTime >= currentTime;
                    });
                    const trueUpcomingEvents = upcomingEventsData.filter(event => {
                        const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                        return startTime > currentTime;
                    });

                    if (trueUpcomingEvents) {
                        setUpcomingEvents(trueUpcomingEvents);
                    }

                    if (pastEventsData) {
                        setPastEvents(pastEventsData);
                    }

                    // Assuming you have a state setter for current events
                    setCurrentEvents(currentEvents);

                    setIsLoading(false);
                } catch (error) {
                    console.error('An error occurred while fetching events:', error);
                    setIsLoading(false);
                }
            };

            // Only fetch events if initial fetch has not been done or if user has privileges
            // A user with privileges will need to see the event they just created/edited
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

                {/* <View className='flex-1 flex-row mx-3'>
                    {userInfo?.publicInfo?.isStudent && (
                        <TouchableOpacity
                            className='flex-1 flex-row items-center justify-center border border-pale-blue rounded-sm py-2 mx-2'
                            onPress={() => navigation.navigate("QRCodeScanningScreen")}
                        >
                            <FontAwesome name="camera" size={24} color="#72A9BE" />
                            <Text className='font-bold text-pale-blue text-lg ml-2'>QRCode Scan</Text>
                        </TouchableOpacity>
                    )}
                </View> */}

                {/* Filters */}
                <ScrollView horizontal={true} className='mt-3' showsHorizontalScrollIndicator={false}>
                    <View className='flex-row'>
                        {Object.values(EventType).map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-row items-center justify-center border rounded-md py-2 px-4 mx-2 mb-2 ${selectedFilter === type ? 'bg-pale-blue' : 'border-pale-blue'}`}
                                onPress={() => handleFilterSelect(type)}
                            >
                                <Text className={`font-bold ${selectedFilter === type ? 'text-white' : 'text-pale-blue'}`}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            className='flex-row items-center justify-center border border-red-400 rounded-md py-2 px-4 mx-2 mb-2'
                            onPress={() => setSelectedFilter(null)}
                        >
                            <Text className='font-bold text-red-400'>Reset Filter</Text>
                        </TouchableOpacity>
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
                        {filteredEvents(currentEvents).length === 0 && filteredEvents(upcomingEvents).length === 0 && filteredEvents(pastEvents).length === 0 ? (
                            <View className='h-32 w-full justify-center items-center'>
                                <Text className='text-lg font-bold'>No Events</Text>
                            </View>
                        ) : (
                            <View>
                                {filteredEvents(currentEvents).length !== 0 && (
                                    <View>
                                        <Text className='text-xl mb-2 mt-8 font-bold'>On-Going Events</Text>
                                        <EventsList
                                            events={filteredEvents(currentEvents)}
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

                {/* {(!isLoading && pastEvents.length >= 5) &&
                    <TouchableOpacity
                        className='flex-row items-center justify-center border border-pale-blue rounded-sm py-2 mx-2 my-4 w-1/2'
                        onPress={async () => {
                            setPastEventModalVisible(true)

                            if (initialPastFetch) {
                                return;
                            }

                            setIsLoading(true);
                            const allPastEventsData = await getPastEvents();
                            if (allPastEventsData) {
                                setAllPastEvents(allPastEventsData);
                                setIsLoading(false);
                                setInitialPastFetch(true);
                            }
                        }}>
                        <Text className='font-bold text-pale-blue text-lg ml-2'>View All Past Events</Text>
                    </TouchableOpacity>
                } */}

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

            <Modal
                animationType="slide"
                transparent={true}
                visible={pastEventModalVisible}
                onRequestClose={() => {
                    setPastEventModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white flex-1'>

                    <View className='flex-row items-center h-10 mb-4 justify-end'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">All Past Events</Text>
                        </View>
                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setPastEventModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        <View className='mx-5 mt-4'>
                            {isLoading &&
                                <View className='h-64 justify-center items-center'>
                                    <ActivityIndicator size="large" />
                                </View>
                            }

                            {(allPastEvents.length == 0 && !isLoading) &&
                                <View className='h-64 w-full justify-center items-center'>
                                    <Text>No Events</Text>
                                </View>
                            }

                            {(!isLoading && allPastEvents.length != 0) &&
                                <EventsList
                                    events={filteredEvents(allPastEvents)}
                                    navigation={navigation}
                                    onEventClick={() => setPastEventModalVisible(false)}
                                />
                            }
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default Events;
