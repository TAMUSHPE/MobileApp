import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { EventProps, SHPEEventScreenRouteProp } from '../types/Navigation'
import { useFocusEffect, useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { SHPEEventID, monthNames } from '../types/Events';
import { getEvent, isUserSignedIn } from '../api/firebaseUtils';
import { auth } from "../config/firebaseConfig";


const EventInfo = ({ navigation }: EventProps) => {
    const route = useRoute<SHPEEventScreenRouteProp>();
    const { eventId } = route.params;
    const [event, setEvent] = useState<SHPEEventID>();
    const [userSignedIn, setUserSignedIn] = useState(false);

    const startDateAsDate = event?.startDate ? event?.startDate.toDate() : null;
    const endDateAsDate = event?.endDate ? event?.endDate.toDate() : null;

    useFocusEffect(
        useCallback(() => {
            const fetchUserInLog = async () => {
                const isUserInLog = await isUserSignedIn(eventId, auth?.currentUser?.uid!);
                setUserSignedIn(isUserInLog);
            };

            const fetchEventData = async () => {
                console.log("fetching");
                try {
                    const eventData = await getEvent(eventId);
                    if (eventData) {
                        setEvent({ ...eventData, id: eventId });
                    }
                } catch (error) {
                    console.error("An error occurred while fetching the event: ", error);
                }
            };
            fetchUserInLog();

            fetchEventData();

            // Optional: Return a cleanup function
            return () => {
                // Any cleanup operation, if needed.
            };
        }, [eventId])
    );


    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const year = date.getFullYear();

        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const amPm = hours >= 12 ? 'PM' : 'AM';

        return `${month} ${day}, ${year} - ${formattedHours}:${formattedMinutes} ${amPm}`;
    }

    if (!event) {
        return (
            <View className='h-screen w-screen justify-center items-center'>
                <ActivityIndicator size="large" />
            </View>
        )
    } else {
        return (
            <SafeAreaView>
                <View className='flex-row mt-4 w-screen'>
                    <View className='justify-center w-[33%]'>
                        <TouchableOpacity className="pr-4 ml-4" onPress={() => navigation.navigate("EventsScreen")} >
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View className='justify-center items-center  w-[33%]'>
                        <Text className="text-3xl h-10 text-center">{event.name}</Text>
                    </View>
                    <View className='justify-center items-end w-[33%]'>
                        <TouchableOpacity className='bg-blue-400 w-16 h-10 items-center justify-center rounded-md mr-4'
                            onPress={() => navigation.navigate("UpdateEvent", { event: event })}>
                            <Text className='font-bold'>Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='w-screen h-[80%] items-center justify-center'>
                    <Text className='text-lg font-bold'>Attendance: {event.attendance || 0}</Text>
                    <Text className='text-lg font-bold'>Description: {event.description}</Text>
                    <Text className='text-lg font-bold'>Location: {event.location}</Text>
                    {startDateAsDate &&
                        <Text className='text-lg font-bold'>Start Date: {formatDate(startDateAsDate)}</Text>
                    }

                    {endDateAsDate &&
                        <Text className='text-lg font-bold'>End Date: {formatDate(endDateAsDate)}</Text>
                    }
                    <Text className="text-lg font-bold">{userSignedIn && "You are signed in to this event"}</Text>
                </View>
            </SafeAreaView>
        )
    }
}

export default EventInfo