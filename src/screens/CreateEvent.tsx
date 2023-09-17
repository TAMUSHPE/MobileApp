import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SHPEEvent, monthNames } from '../types/Events'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../types/Navigation';
import { createEvent } from '../api/firebaseUtils';
import DatePicker from 'react-native-date-picker'
import { Timestamp } from 'firebase/firestore';
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';

const CreateEvent = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [event, setEvent] = useState<SHPEEvent>({
        description: "",
        location: "",
        pointsCategory: "General Meeting",
        notificationGroup: "All",
    });

    const [startOpen, setStartOpen] = useState(false)
    const [endOpen, setEndOpen] = useState(false)
    const startDateAsDate = event.startDate ? event.startDate.toDate() : new Date();
    const endDateAsDate = event.endDate ? event.endDate.toDate() : new Date();

    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);



    useEffect(() => {
        if (event.startDate) {
            setShowStartDate(true)
        }
        if (event.endDate) {
            setShowEndDate(true)
        }
    }, [event])

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, "0");
        const amPm = hours >= 12 ? 'PM' : 'AM';

        return `${month} ${day} - ${formattedHours}:${formattedMinutes} ${amPm}`;
    }


    const handleCreateEvent = async () => {
        if (!event.name) {
            alert("Please enter a name for the event.");
            return;
        }

        if (!event.startDate) {
            alert("Please select a start date");
            return;
        }
        if (!event.endDate) {
            alert("Please select an end date");
            return;
        }

        if (startDateAsDate.getTime() > endDateAsDate.getTime()) {
            alert("Start date must be before end date");
            return;
        }


        const newEventId = await createEvent(event);
        if (newEventId) {
            const updatedEvent = {
                ...event,
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
                                className={`w-[90%] rounded-md text-xl py-1 ${event?.name ? 'font-normal' : 'font-extrabold'}`}
                                value={event?.name}
                                onChangeText={(text) => setEvent({ ...event, name: text })}
                                placeholder="Name"
                            />
                        </View>
                    </View>

                    <View className='flex-row mt-4'>
                        <View className='w-[48%] mr-[2%]'>
                            <Text className='text-gray-500'>Start Date</Text>
                            <TouchableOpacity
                                onPress={() => setStartOpen(true)}
                            >
                                <View className='flex-row border-b-2 py-1 h-10 border-gray-400 justify-between '>
                                    {showStartDate &&
                                        <Text className='text-lg font-extrabold'>
                                            {formatDate(startDateAsDate)}
                                        </Text>
                                    }
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View className='w-[48%] ml-[2%]'>
                            <Text className='text-gray-500'>End Date</Text>
                            <TouchableOpacity
                                onPress={() => setEndOpen(true)}
                            >
                                <View className='flex-row border-b-2 py-1 h-10 border-gray-400 justify-between '>
                                    {showEndDate &&
                                        <Text className='text-lg font-extrabold'>
                                            {formatDate(endDateAsDate)}
                                        </Text>
                                    }
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='flex-row mt-4'>
                        <View className='w-[48%] mr-[2%]'>
                            <Text className='text-gray-500'>Points</Text>

                            <View className='w-full border-b-2 border-gray-400'>

                                <Picker
                                    style={{ width: '100%' }}
                                    selectedValue={event.pointsCategory}
                                    onValueChange={(itemValue, itemIndex) =>
                                        setEvent({ ...event, pointsCategory: itemValue })
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
                                    selectedValue={event.notificationGroup}
                                    onValueChange={(itemValue, itemIndex) =>
                                        setEvent({ ...event, notificationGroup: itemValue })
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
            <DatePicker
                modal
                mode="datetime"
                open={startOpen}
                date={startDateAsDate}
                onConfirm={(date) => {
                    setStartOpen(false)
                    setEvent({
                        ...event,
                        startDate: Timestamp.fromDate(date)
                    });
                }}
                onCancel={() => {
                    setStartOpen(false)
                }}
            />

            <DatePicker
                modal
                mode="datetime"
                open={endOpen}
                date={endDateAsDate}
                onConfirm={(date) => {
                    setEndOpen(false)
                    setEvent({
                        ...event,
                        endDate: Timestamp.fromDate(date)
                    });
                }}
                onCancel={() => {
                    setEndOpen(false)
                }}
            />
        </ScrollView>
    )
}

export default CreateEvent