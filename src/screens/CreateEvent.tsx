import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SHPEEvent, monthNames } from '../types/Events'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../types/Navigation';
import { createEvent } from '../api/firebaseUtils';
import { Timestamp } from 'firebase/firestore';
import { Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images } from '../../assets';

const CreateEvent = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [newEvent, setNewEvent] = useState<SHPEEvent>({
        description: "",
        location: "",
        pointsCategory: "General Meeting",
        notificationGroup: "All",
    });

    const [showStartDate, setShowStartDate] = useState(false);
    const [showStartTime, setShowStartTime] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);

    const startDate = (newEvent.startDate ? newEvent.startDate.toDate() : new Date());
    const endDate = (newEvent.endDate ? newEvent.endDate.toDate() : new Date());

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


    const handleCreateEvent = async () => {
        if (!newEvent.name) {
            alert("Please enter a name for the event.");
            return;
        }

        if (!newEvent.startDate) {
            alert("Please select a start date");
            return;
        }
        if (!newEvent.endDate) {
            alert("Please select an end date");
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            alert("Start date must be before end date");
            return;
        }


        const newEventId = await createEvent(newEvent);
        if (newEventId) {
            const updatedEvent = {
                ...newEvent,
                id: newEventId
            };
            navigation.replace("UpdateEvent", { event: updatedEvent });
        } else {
            console.error("Failed to create a new event.");
        }
    }


    return (
        <ScrollView>
            <SafeAreaView>
                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">Create Event</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={() => navigation.goBack()} >
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Image */}
                <View className='justify-center items-center'>
                    <Image
                        className="mt-8 h-60 w-[90%] bg-gray-700 rounded-xl"
                        source={Images.EVENT}
                    />
                </View>

                {/* Form */}
                <View className='mt-9 p-6'>
                    <View>
                        <Text className='text-gray-500'>Event Title</Text>
                        <View className='flex-row border-b-2 border-slate-400'>
                            <TextInput
                                className={`w-[90%] rounded-md text-xl py-1 ${newEvent?.name ? 'font-normal' : 'font-extrabold'}`}
                                value={newEvent?.name}
                                onChangeText={(text) => setNewEvent({ ...newEvent, name: text })}
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
                                            setNewEvent({
                                                ...newEvent,
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
                                            setNewEvent({
                                                ...newEvent,
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

                    <View className='flex-row mt-4'>
                        <View className='w-[48%] mr-[2%]'>
                            <Text className='text-gray-500'>Points</Text>

                            <View className='w-full border-b-2 border-gray-400'>

                                <Picker
                                    style={{ width: '100%' }}
                                    selectedValue={newEvent.pointsCategory}
                                    onValueChange={(itemValue, itemIndex) =>
                                        setNewEvent({ ...newEvent, pointsCategory: itemValue })
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
                                    selectedValue={newEvent.notificationGroup}
                                    onValueChange={(itemValue, itemIndex) =>
                                        setNewEvent({ ...newEvent, notificationGroup: itemValue })
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

                    <View className='w-full justify-center items-center mt-8'>
                        <TouchableOpacity
                            onPress={handleCreateEvent}
                            className='w-[75%] h-16 px-4  bg-blue-400 rounded-md justify-center items-center'
                        >
                            <Text className='text-lg font-bold'>Create Event</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </SafeAreaView>
            {showStartDate && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={startDate}
                    mode={"date"}
                    onChange={
                        (event, selectedDate) => {
                            setShowStartDate(false);
                            setNewEvent({
                                ...newEvent,
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
                            setNewEvent({
                                ...newEvent,
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
                            setNewEvent({
                                ...newEvent,
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
                            setNewEvent({
                                ...newEvent,
                                endDate: Timestamp.fromDate(selectedDate!)
                            });
                            setShowEndTime(false);
                        }
                    }
                />
            )}
        </ScrollView>
    )
}

export default CreateEvent