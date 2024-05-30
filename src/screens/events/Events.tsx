import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { getUpcomingEvents, getPastEvents } from '../../api/firebaseUtils';
import { EventsStackParams } from '../../types/Navigation';
import { SHPEEvent } from '../../types/Events';
import CalendarICON from '../../../assets/calandar_pale_blue.svg'
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
    const [initialPastFetch, setInitialPastFetch] = useState(false);



    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                try {
                    setIsLoading(true);

                    const upcomingEventsData = await getUpcomingEvents();
                    const pastEventsData = await getPastEvents(5);

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
        <SafeAreaView edges={["top"]}>
            <ScrollView>
                <View className='flex-row mt-4'>
                    <View className='w-full justify-center items-center'>
                        <Text className="text-3xl h-10">Events</Text>
                    </View>
                </View>

                <View className='flex-1 flex-row mx-3'>
                    {!userInfo?.publicInfo?.isStudent && (
                        <TouchableOpacity
                            className='flex-1 flex-row items-center justify-center border border-pale-blue rounded-sm py-2 mx-2'
                            onPress={() => navigation.navigate("QRCodeScanningScreen")}
                        >
                            <FontAwesome name="camera" size={24} color="#72A9BE" />
                            <Text className='font-bold text-pale-blue text-lg ml-2'>QRCode Scan</Text>
                        </TouchableOpacity>
                    )}

                    {hasPrivileges &&
                        <TouchableOpacity
                            className='flex-1 flex-row items-center justify-center border border-pale-blue rounded-sm py-2 mx-2'
                            onPress={() => navigation.navigate("CreateEvent")}>
                            <CalendarICON width={24} height={24} />
                            <Text className='font-bold text-pale-blue text-lg ml-2'>Create Event</Text>
                        </TouchableOpacity>
                    }
                </View>

                {isLoading &&
                    <View className='h-64 justify-center items-center'>
                        <ActivityIndicator size="large" />
                    </View>
                }

                {(upcomingEvents.length == 0 && pastEvents.length == 0 && !isLoading) &&
                    <View className='h-64 w-full justify-center items-center'>
                        <Text>No Events</Text>
                    </View>
                }
                <View className='mx-5 mt-4'>
                    {(!isLoading && currentEvents.length != 0) &&
                        <>
                            <Text className='text-xl mb-2 mt-8 font-bold'>On-Going Events</Text>
                            <EventsList
                                events={currentEvents}
                                navigation={navigation}
                            />
                        </>
                    }


                    {(!isLoading && upcomingEvents.length != 0) &&
                        <>
                            <Text className='text-xl mb-2 mt-8 font-bold'>Upcoming Events</Text>
                            <EventsList
                                events={upcomingEvents}
                                navigation={navigation}
                            />
                        </>
                    }

                    {(!isLoading && pastEvents.length != 0) &&
                        <>
                            <Text className='text-xl mb-2 mt-8 font-bold '>Past Events</Text>
                            <EventsList
                                events={pastEvents}
                                navigation={navigation}
                            />
                        </>
                    }
                </View>

                {(!isLoading && pastEvents.length >= 5) &&
                    <TouchableOpacity
                        className='flex-row items-center justify-center border border-pale-blue rounded-sm py-2 mx-2 my-4'
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
                }


            </ScrollView>
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
                                    events={allPastEvents}
                                    navigation={navigation}
                                    onEventClick={() => setPastEventModalVisible(false)}
                                />
                            }
                        </View>
                    </ScrollView>
                </View>
            </Modal>

        </SafeAreaView >
    );
};

export default Events;