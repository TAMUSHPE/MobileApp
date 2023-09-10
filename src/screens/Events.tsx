import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../types/Navigation';
import { getEvents } from '../api/firebaseUtils';
import { SHPEEventID } from '../types/Events';
import EventCard from '../components/EventCard';

const Events = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [events, setEvents] = useState<SHPEEventID[]>([]);
    useEffect(() => {
        const fetchEvents = async () => {
            const eventsData = await getEvents();
            if (eventsData) {
                setEvents(eventsData);
            }
        };

        fetchEvents();
    }, [])
    console.log(events)
    return (
        <SafeAreaView>
            <View className='justify-center items-center pt-4'>
                <TouchableOpacity className='bg-blue-400 items-center justify-center w-28 h-28'
                    onPress={() => navigation.navigate("CreateEvent")}>
                    <Text>Create Event</Text>
                </TouchableOpacity>
            </View>

            <View>
                <Text>Events</Text>
                {events.map((event) => {
                    return (
                        <TouchableOpacity
                            key={event.id}
                            onPress={() => navigation.navigate("SHPEEvent", { event })}
                            className='w-screen bg-blue-400 mb-4'
                        >
                            <EventCard event={event} navigation={navigation} />
                        </TouchableOpacity>
                    )
                })}
            </View>
        </SafeAreaView>
    )
}

export default Events