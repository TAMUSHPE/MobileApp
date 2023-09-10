import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { EventProps, SHPEEventScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';

const SHPEEvent = ({ navigation }: EventProps) => {
    const route = useRoute<SHPEEventScreenRouteProp>();
    const { event } = route.params;
    console.log(event)
    return (
        <SafeAreaView>
            <TouchableOpacity onPress={() => navigation.navigate("EventsScreen")}>
                <Text className='text-2xl'>Back</Text>
            </TouchableOpacity>
            <View className='flex-row-reverse'>
                <TouchableOpacity className=' bg-blue-400 w-28 rounded-lg mt-4'
                    onPress={() => navigation.navigate("UpdateEvent", { event: event })}>
                    <Text className='text-center text-xl'>Edit</Text>
                </TouchableOpacity>

            </View>
            <View className='w-screen'>
                <Text className='justify-center items-center text-center text-3xl'>{event.name}</Text>
                <Text>{event.description}</Text>
                <Text>{event.location}</Text>
                <Text>{event.startDate}</Text>
                <Text>{event.endDate}</Text>
            </View>
        </SafeAreaView>
    )
}

export default SHPEEvent