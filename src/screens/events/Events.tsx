import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/Navigation';
import { getUpcomingEvents, getPastEvents } from '../../api/firebaseUtils';
import { SHPEEvent } from '../../types/Events';
import EventCard from '../../components/EventCard';
import { useFocusEffect } from '@react-navigation/native';
import { UserContext } from '../../context/UserContext';
import { AntDesign } from '@expo/vector-icons';

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
        <SafeAreaView
            edges={["top", "left", "right"]}>
            <ScrollView>

                <View className='flex-row mt-4'>
                    <View className='w-full justify-center items-center'>
                        <Text className="text-3xl h-10">Events</Text>
                    </View>
                    {
                        hasPrivileges &&
                        < View className='absolute w-full items-end justify-center'>
                            <TouchableOpacity className='bg-pale-blue w-16 h-10 items-center justify-center rounded-md mr-4'
                                onPress={() => navigation.navigate("CreateEvent")}>
                                <Text className='font-bold text-gray-100'>Create</Text>
                            </TouchableOpacity>
                        </View>
                    }
                </View>
                <TouchableOpacity
                    className='flex flex-row items-center justify-center space-x-1 border-2 rounded-full py-1 my-2'
                    onPress={() => navigation.navigate("QRCodeScanningScreen")}
                >
                    <AntDesign name="qrcode" size={30} color={"black"} />
                    <Text className='text-lg'>Scan QR Code</Text>
                </TouchableOpacity>

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
                <View className='ml-2 mt-4'>
                    {upcomingEvents.length != 0 &&
                        <Text className='text-xl mb-4 text-bold'>Upcoming Events</Text>
                    }

                    {upcomingEvents.map((event) => <EventCard key={event.id} event={event} navigation={navigation} />)}

                    {pastEvents.length != 0 &&
                        <Text className='text-xl mb-4 text-bold '>Past Events</Text>
                    }

                    {pastEvents.map((event) => <EventCard key={event.id} event={event} navigation={navigation} />)}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Events;