import { View, Text } from 'react-native'
import React from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';

const EventCard: React.FC<EventProps> = ({ event, navigation }) => {

    return (
        <View>
            <Text>{event?.name}</Text>
            <Text>{event?.description}</Text>
        </View>
    )
}

export default EventCard