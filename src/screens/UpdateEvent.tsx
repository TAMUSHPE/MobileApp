import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform } from 'react-native'
import React, { useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SHPEEventID, monthNames } from '../types/Events';
import { destroyEvent, updateEvent } from '../api/firebaseUtils';
import { Octicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images } from '../../assets';
import { Timestamp } from 'firebase/firestore';

const UpdateEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const [updatedEvent, setUpdatedEvent] = useState<SHPEEventID>(event);
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

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];

        return `${month} ${day}`;
    }

    const formatTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const amPm = hours >= 12 ? 'PM' : 'AM';

        return `${formattedHours}:${formattedMinutes} ${amPm}`
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
                        source={Images.EVENT}
                    />
                </View>

                {/* Form */}
                <View className='mt-9 p-6'>
                    <View>
                        <Text className='text-gray-500'>Event Title</Text>
                        <View className='flex-row border-b-2 border-slate-400'>
                            <TextInput
                                className={`w-[90%] rounded-md text-xl py-1 ${updatedEvent?.name ? 'font-normal' : 'font-extrabold'}`}
                                value={updatedEvent?.name}
                                onChangeText={(text) => setUpdatedEvent({ ...event, name: text })}
                                placeholder="Name"
                            />
                        </View>
                    </View>

                    {Platform.OS === 'ios' &&
                        <View className='mt-4'>
                            <View className='flex-row items-center'>
                                <Text className='text-gray-500 text-lg text-center'>Start Date</Text>
                                <View className='flex-row py-1 h-10 border-gray-400'>
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={startDate}
                                        mode={"datetime"}
                                        onChange={(event, selectedDate) => {
                                            setUpdatedEvent({
                                                ...updatedEvent,
                                                startDate: Timestamp.fromDate(selectedDate!)
                                            });
                                        }}
                                    />
                                </View>
                            </View>

                            <View className='flex-row items-center'>
                                <Text className='text-gray-500 text-lg text-center'>End Date</Text>
                                <View className='flex-row py-1 h-10 border-gray-400'>
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={endDate}
                                        mode={"datetime"}
                                        onChange={(event, selectedDate) => {
                                            setUpdatedEvent({
                                                ...updatedEvent,
                                                endDate: Timestamp.fromDate(selectedDate!)
                                            });
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    }

                    {Platform.OS === 'android' &&
                        <View className='flex-row mt-4'>
                            <View className='w-[48%] mr-[2%]'>
                                <Text className='text-gray-500'>Start Date</Text>
                                <View className='flex-row border-b-2 py-1 h-10 border-gray-400'>
                                    <TouchableOpacity onPress={() => setShowStartDate(true)}>
                                        <Text className='text-lg font-extrabold'>
                                            {formatDate(startDate)} - { }
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setShowStartTime(true)}>
                                        <Text className='text-lg font-extrabold'>
                                            {formatTime(startDate)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className='w-[48%] ml-[2%]'>
                                <Text className='text-gray-500'>End Date</Text>

                                <View className='flex-row border-b-2 py-1 h-10 border-gray-400'>
                                    <TouchableOpacity onPress={() => setShowEndDate(true)}>
                                        <Text className='text-lg font-extrabold'>
                                            {formatDate(endDate)} - { }
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowEndTime(true)}>
                                        <Text className='text-lg font-extrabold'>
                                            {formatTime(endDate)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    }
                    <View className='flex-row mt-20'>
                        <View className='w-[48%] mr-[2%]'>
                            <Text className='text-gray-500'>Points</Text>

                            <View className='w-full border-b-2 border-gray-400'>

                                <Picker
                                    style={{ width: '100%' }}
                                    selectedValue={updatedEvent.pointsCategory}
                                    onValueChange={(itemValue, itemIndex) =>
                                        setUpdatedEvent({ ...updatedEvent, pointsCategory: itemValue })
                                    }>

                                    {/* Can use mapping for this */}
                                    <Picker.Item label="General Meeting" value="1" />
                                    <Picker.Item label="Community Service" value="2" />
                                    <Picker.Item label="Professional Workshop" value="3" />
                                    <Picker.Item label="Academic Social" value="4" />
                                    <Picker.Item label="Elections" value="5" />
                                </Picker>
                            </View>
                        </View>

                        <View className='w-[48%] ml-[2%]'>
                            <Text className='text-gray-500'>Notification Group</Text>

                            <View className='w-full border-b-2 border-gray-400'>
                                <Picker
                                    style={{ width: '100%' }}
                                    selectedValue={updatedEvent.notificationGroup}
                                    onValueChange={(itemValue, itemIndex) =>
                                        setUpdatedEvent({ ...updatedEvent, notificationGroup: itemValue })
                                    }>
                                    {/* Can use mapping for this */}
                                    <Picker.Item label="All" value="6" />
                                    <Picker.Item label="Tech" value="7" />
                                    <Picker.Item label="MentorSHPE" value="8" />
                                    <Picker.Item label="Scholastic" value="9" />
                                    <Picker.Item label="SHPEtinas" value="10" />
                                </Picker>
                            </View>
                        </View>
                    </View>


                    <View className='mt-20'>
                        <Text className='text-gray-500 mb-2'>Description</Text>
                        <TextInput
                            className='w-full rounded-md text-lg px-2 py-1 bg-white h-32'
                            value={updatedEvent?.description}
                            onChangeText={(text) => setUpdatedEvent({ ...updatedEvent, description: text })}
                            placeholder="Add a description"
                            multiline={true}
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                    <View className='mt-7'>
                        <Text className='text-gray-500 mb-2'>Location</Text>
                        <TextInput
                            className='w-full rounded-md h-16 text-lg px-2 py-1 bg-white'
                            value={updatedEvent?.location}
                            onChangeText={(text) => setUpdatedEvent({ ...updatedEvent, location: text })}
                            placeholder="Add a location"
                            multiline={true}
                            style={{ textAlignVertical: 'top' }}
                        />
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
            {showStartDate && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={startDate}
                    mode={"date"}
                    onChange={
                        (event, selectedDate) => {
                            setShowStartDate(false);
                            setUpdatedEvent({
                                ...updatedEvent,
                                startDate: Timestamp.fromDate(selectedDate!)
                            });
                        }
                    }
                />
            )}

            {showStartTime && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={startDate}
                    mode={"time"}
                    onChange={
                        (event, selectedDate) => {
                            setShowStartTime(false);
                            setUpdatedEvent({
                                ...updatedEvent,
                                startDate: Timestamp.fromDate(selectedDate!)
                            });
                        }
                    }
                />
            )}

            {showEndDate && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={endDate}
                    mode={"date"}
                    onChange={
                        (event, selectedDate) => {
                            setUpdatedEvent({
                                ...updatedEvent,
                                endDate: Timestamp.fromDate(selectedDate!)
                            });
                            setShowEndDate(false);
                        }
                    }
                />
            )}

            {showEndTime && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={endDate}
                    mode={"time"}
                    onChange={
                        (event, selectedDate) => {
                            setUpdatedEvent({
                                ...updatedEvent,
                                endDate: Timestamp.fromDate(selectedDate!)
                            });
                            setShowEndTime(false);
                        }
                    }
                />
            )}
        </SafeAreaView >
    )
}

export default UpdateEvent