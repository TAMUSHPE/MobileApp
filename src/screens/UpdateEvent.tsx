import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { UpdateEventProps, UpdateEventScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';

const UpdateEvent = ({ navigation }: UpdateEventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { id } = route.params;
    // create QRCode
    // make QRCode downloadable
    // make editor

    return (
        <SafeAreaView>
            <TouchableOpacity onPress={() => navigation.navigate("EventsScreen")}>
                <Text className='text-2xl'>Back</Text>
            </TouchableOpacity>
            <Text>UpdateEvent: {id}</Text>
        </SafeAreaView>
    )
}

export default UpdateEvent