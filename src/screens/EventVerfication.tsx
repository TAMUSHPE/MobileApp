import { View, Text } from 'react-native'
import React from 'react'
import SvgQRCode from 'react-native-qrcode-svg';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';

const EventVerfication = ({ navigation }: EventVerificationProps) => {
    const route = useRoute<EventVerificationScreenRouteProp>();
    const { id } = route.params;
    return (
        <View>
            <Text>Event: {id} </Text>
            <SvgQRCode value="tamu-shpe://event?id=123" />
        </View>
    )
}

export default EventVerfication