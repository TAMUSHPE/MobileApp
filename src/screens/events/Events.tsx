import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { getUpcomingEvents, getPastEvents } from '../../api/firebaseUtils';
import { EventsStackParams } from '../../types/Navigation';
import { SHPEEvent } from '../../types/Events';
import CalendarICON from '../../../assets/calandar_pale_blue.svg'
import EventsList from '../../components/EventsList';

const Events = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [upcomingEvents, setUpcomingEvents] = useState<SHPEEvent[]>([]);
    const [pastEvents, setPastEvents] = useState<SHPEEvent[]>([]);
    const userContext = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(true);
    const { userInfo } = userContext!;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    useFocusEffect(
        useCallback(() => {
            const fetchEvents = async () => {
                try {
                    setIsLoading(true);

                    const upcomingEventsData = await getUpcomingEvents();
                    const pastEventsData = await getPastEvents();

                    if (upcomingEventsData) {
                        setUpcomingEvents(upcomingEventsData);
                    }

                    if (pastEventsData) {
                        setPastEvents(pastEventsData);
                    }

                    setIsLoading(false);
                } catch (error) {
                    console.error('An error occurred while fetching events:', error);
                    setIsLoading(false);
                }
            };
            fetchEvents();
        }, [])
    );

    return (
        <SafeAreaView edges={["top"]}>
            <ScrollView>
                <View className='flex-row mt-4'>
                    <View className='w-full justify-center items-center'>
                        <Text className="text-3xl h-10">Events</Text>
                    </View>
                </View>

                <View className='flex-1 flex-row'>
                    <TouchableOpacity
                        className='flex-1 flex-row items-center justify-center border border-pale-blue rounded-md py-2 mx-2'
                        onPress={() => navigation.navigate("QRCodeScanningScreen")}
                    >
                        <FontAwesome name="camera" size={24} color="#72A9BE" />
                        <Text className='font-bold text-pale-blue text-lg ml-2'>QRCode Scan</Text>
                    </TouchableOpacity>

                    {hasPrivileges &&
                        <TouchableOpacity
                            className='flex-1 flex-row items-center justify-center border border-pale-blue rounded-md py-2 mx-2'
                            onPress={() => navigation.navigate("CreateEvent")}>
                            <CalendarICON width={24} height={24} />
                            <Text className='font-bold text-pale-blue text-lg ml-2'>Create Event</Text>
                        </TouchableOpacity>
                    }
                </View>

                {isLoading && upcomingEvents.length == 0 && pastEvents.length == 0 &&
                    <View className='h-64 justify-center items-center'>
                        <ActivityIndicator size="large" />
                    </View>
                }

                {upcomingEvents.length == 0 && pastEvents.length == 0 && !isLoading &&
                    <View className='h-64 w-full justify-center items-center'>
                        <Text>No Events</Text>
                    </View>
                }
                <View className='mx-2 mt-4'>
                    {upcomingEvents.length != 0 &&
                        <>
                            <Text className='text-xl mb-4 font-bold'>Upcoming Events</Text>
                            <EventsList
                                events={upcomingEvents}
                                navigation={navigation}
                            />
                        </>
                    }

                    {pastEvents.length != 0 &&
                        <>
                            <Text className='text-xl mb-4 text-bold font-bold '>Past Events</Text>
                            <EventsList
                                events={pastEvents}
                                navigation={navigation}
                            />
                        </>
                    }
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};

export default Events;