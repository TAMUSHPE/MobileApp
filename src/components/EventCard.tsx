import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../types/Navigation'
import { monthNames } from '../types/Events'
import { Images } from '../../assets'
import { Octicons } from '@expo/vector-icons';

const EventCard: React.FC<EventProps> = ({ event, navigation }) => {
    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        return `${month} ${day} ${year}`;
    }

    return (
        <TouchableOpacity onPress={() => navigation.navigate("EventInfo", { eventId: event?.id! })}>
            <View className='h-20 flex flex-row rounded-md my-2 overflow-hidden'>
                <View className='h-full w-[20%] justify-center items-center bg-slate-300'>
                    {event?.coverImageURI &&
                        <Image
                            source={{ uri: event.coverImageURI }}
                            className='min-h-full min-w-full'
                        />
                    }
                    {!event?.coverImageURI &&
                        <Octicons name='repo' size={50} />
                    }
                </View>
                <View className='h-full flex flex-col flex-1 pl-4 bg-slate-200'>
                    {event?.startTime &&
                        <Text className='text-red-500 text-lg font-bold flex-1'>{formatDate(event?.startTime?.toDate() ?? null)}</Text>
                    }
                    <Text className='text-xl font-bold flex-1'>{event?.name}</Text>
                    <Text className='text-lg text-grey flex-1'>{event?.locationName}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default EventCard