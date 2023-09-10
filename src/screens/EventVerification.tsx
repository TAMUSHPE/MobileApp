import { View, Text } from 'react-native'
import React, { useEffect, useRef } from 'react';
import { useRoute } from '@react-navigation/core';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../types/Navigation'
import { addEventLog } from '../api/firebaseUtils';

const EventVerification = ({ navigation }: EventVerificationProps) => {
    const route = useRoute<EventVerificationScreenRouteProp>();
    const { id } = route.params;

    useEffect(() => {
        addEventLog(id)
    }, []);

    return (
        <View className='w-screen h-screen bg-green-600'>
            <Text>Event: {id} </Text>
        </View>
    )
}

export default EventVerification