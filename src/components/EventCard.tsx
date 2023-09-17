import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../types/Navigation'
import { monthNames } from '../types/Events'

const EventCard: React.FC<EventProps> = ({ event, navigation }) => {
    const startDateAsDate = event?.startDate ? event?.startDate.toDate() : null;

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        return `${month} ${day} ${year}`;
    }
    return (
        <TouchableOpacity onPress={() => navigation.navigate("EventInfo", { eventId: event?.id! })}>
            <View className='flex-row'>
                <View className='justify-center ml-2 mr-4 py-2 '>
                    <Image
                        source={require("../../assets/github-logo.png")}
                        className='h-12 w-12 rounded-full'
                        resizeMode='contain'
                    />
                </View>
                <View>
                    {startDateAsDate &&
                        <Text className='text-red-500 text-lg font-bold'>{formatDate(startDateAsDate)}</Text>
                    }
                    <Text className='text-xl font-bold'>{event?.name}</Text>
                    <Text className='text-lg text-grey'>{event?.location}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default EventCard