import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../types/Navigation';


const Events = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    // Create Events
    // View Events
    return (
        <SafeAreaView>
            <View className='justify-center items-center pt-4'>
                <TouchableOpacity className='bg-blue-400 items-center justify-center w-28 h-28'
                    onPress={() => navigation.navigate("CreateEvent")}>
                    <Text>Create Event</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default Events