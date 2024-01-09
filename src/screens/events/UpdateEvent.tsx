import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform } from 'react-native'
import React, { useContext, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { monthNames, SHPEEvent } from '../../types/Events';
import { destroyEvent, updateEvent } from '../../api/firebaseUtils';
import { Octicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images } from '../../../assets';
import { Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';

const UpdateEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const [updatedEvent, setUpdatedEvent] = useState<SHPEEvent>(event);
    const [updated, setUpdated] = useState(false);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showStartTime, setShowStartTime] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);

    const startDate = updatedEvent.startTime?.toDate()
    const endDate = updatedEvent.endTime?.toDate()

    const handleUpdateEvent = async () => {
        const newEvent = await updateEvent(updatedEvent);
        if (newEvent) {
            setUpdated(true);
        } else {
            console.log('Event update failed');
        }
    }

    const handleDestroyEvent = async () => {
        const isDeleted = await destroyEvent(updatedEvent.id!);
        if (isDeleted) {
            navigation.navigate("EventsScreen")
        } else {
            console.log("Failed to delete the event.");
        }
    }

    return (
        <SafeAreaView>

            <ScrollView>
                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">{updatedEvent.name}</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={() => navigation.navigate("EventInfo", { eventId: updatedEvent.id! })} >
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mt-2 pl-6">
                    <Text className='text-xl font-semibold'>Update Event</Text>
                </View>

                {/* Image */}
                <View className='justify-center items-center'>
                    <Image
                        className="mt-2 h-60 w-[90%] bg-gray-700 rounded-xl"
                        source={event.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                    />
                </View>

                {/* Form */}
                <View className='mt-9 p-6'>
                    <View>
                        <Text className='text-gray-500'>Event Title</Text>
                        <View className='flex-row border-b-2 border-slate-400'>
                            <TextInput
                                className={`w-[90%] rounded-md text-xl py-1 ${updatedEvent?.name ? 'font-normal' : 'font-extrabold'}`}
                                value={updatedEvent?.name ?? ""}
                                onChangeText={(text) => setUpdatedEvent({ ...event, name: text })}
                                placeholder="Event Name"
                            />
                        </View>
                    </View>
                </View>


                <View className='flex-row w-screen justify-center items-center pt-4 space-x-7'>
                    <TouchableOpacity className='w-20 h-10 bg-blue-400 justify-center items-center rounded-md'
                        onPress={() => handleUpdateEvent()}
                    >
                        <Text>Update Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='w-20 h-10 bg-blue-300 justify-center items-center rounded-md'
                        onPress={() => navigation.navigate("QRCode", { event: updatedEvent })}
                    >
                        <Text>View QRCode</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className='w-20 h-10 bg-red-400 justify-center items-center rounded-md'
                        onPress={() => handleDestroyEvent()}
                    >
                        <Text>Destroy Event</Text>
                    </TouchableOpacity>
                </View>
                {updated && <Text className='text-green-500'>Information has been updated</Text>}

                <View className='pb-32'></View>
            </ScrollView >
        </SafeAreaView >
    )
}

export default UpdateEvent