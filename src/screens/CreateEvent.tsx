import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Platform, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { CommitteeMeeting, CustomEvent, EventType, GeneralMeeting, IntramuralEvent, SHPEEvent, SocialEvent, StudyHours, VolunteerEvent, Workshop, monthNames } from '../types/Events'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../types/Navigation';
import { createEvent } from '../api/firebaseUtils';
import { Timestamp } from 'firebase/firestore';
import { Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images } from '../../assets';
import InteractButton from '../components/InteractButton';

const CreateEvent = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [eventType, setEventType] = useState<EventType | undefined>();

    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = monthNames[date.getMonth()];

        return `${month} ${day}`;
    }

    const handleCreateEvent = async () => {
        return;

        // const newEventId = await createEvent(newEvent);
        // if (newEventId) {
        //     const updatedEvent = {
        //         ...newEvent,
        //         id: newEventId
        //     };
        //     navigation.replace("UpdateEvent", { event: updatedEvent });
        // } else {
        //     console.error("Failed to create a new event.");
        // }
    }


    return (
        <ScrollView>
            <SafeAreaView>
                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-6" onPress={() => navigation.goBack()} >
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">Create Event</Text>
                    </View>
                </View>

                {/* Image */}
                <View className='justify-center items-center'>
                    <Image
                        className="mt-8 h-60 w-[90%] bg-gray-700 rounded-xl"
                        source={Images.EVENT}
                    />
                </View>

                <View className='p-6'>
                    <Text className='text-xl'>Before we get started, select what type of event this will be:</Text>
                </View>

                {/* Form */}
                <View className='px-6'>
                    <View className='flex-row'>
                        <View className='w-full'>
                            <Text className='text-gray-500'>Select an event type...</Text>

                            <View className='w-full border-b-2 border-gray-400'>

                                <Picker
                                    selectedValue={eventType}
                                    onValueChange={(eventType) => {
                                        setEventType(eventType);
                                    }}>

                                    {/* Can use mapping for this */}
                                    <Picker.Item label="None" value={undefined} />
                                    <Picker.Item label="General Meeting" value={EventType.GENERAL_MEETING} />
                                    <Picker.Item label="Committee Meeting" value={EventType.COMMITTEE_MEETING} />
                                    <Picker.Item label="Study Hours" value={EventType.STUDY_HOURS} />
                                    <Picker.Item label="Workshop" value={EventType.WORKSHOP} />
                                    <Picker.Item label="Volunteer" value={EventType.VOLUNTEER_EVENT} />
                                    <Picker.Item label="Social" value={EventType.SOCIAL_EVENT} />
                                    <Picker.Item label="Intramural" value={EventType.INTRAMURAL_EVENT} />
                                </Picker>
                            </View>
                        </View>
                    </View>

                    {/* {Platform.OS === 'ios' &&
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
                        </View> }*/
                    }
                    <InteractButton
                        buttonClassName='bg-orange mt-10 mb-4 py-1 rounded-xl'
                        textClassName='text-center text-black'
                        label='Next Step'
                        underlayColor='#123456'
                        onPress={() => {
                            let newEvent: SHPEEvent | undefined = undefined;

                            switch (eventType) {
                                case EventType.GENERAL_MEETING:
                                    newEvent = new GeneralMeeting();
                                    break;
                                case EventType.COMMITTEE_MEETING:
                                    newEvent = new CommitteeMeeting();
                                    break;
                                case EventType.STUDY_HOURS:
                                    newEvent = new StudyHours();
                                    break;
                                case EventType.WORKSHOP:
                                    newEvent = new Workshop();
                                    break;
                                case EventType.VOLUNTEER_EVENT:
                                    newEvent = new VolunteerEvent();
                                    break;
                                case EventType.SOCIAL_EVENT:
                                    newEvent = new SocialEvent();
                                    break;
                                case EventType.INTRAMURAL_EVENT:
                                    newEvent = new IntramuralEvent();
                                    break;
                                case EventType.CUSTOM_EVENT:
                                    newEvent = new CustomEvent();
                                    break;
                                default:
                                    Alert.alert("Select an event type", "Please select an event type to continue.");
                                    break;
                            }

                            if (newEvent != undefined) {
                                Alert.alert("Yay");
                            }
                        }}
                    />
                    <Text className='text-xl text-center pt-2'>Step 1 of 3</Text>
                </View>
            </SafeAreaView>

            {/* {showStartDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={startDate}
                    mode={"date"}
                    onChange={
                        (event, selectedDate) => {
                            setShowStartDatePicker(false);
                            setNewEvent({
                                ...newEvent,
                                startDate: Timestamp.fromDate(selectedDate!)
                            });
                        }
                    }
                />
            )} */}
            {/* {showStartTimePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={startDate}
                    mode={"time"}
                    onChange={
                        (event, selectedDate) => {
                            setShowStartTimePicker(false);
                            setNewEvent({
                                ...newEvent,
                                startDate: Timestamp.fromDate(selectedDate!)
                            });
                        }
                    }
                />
            )} */}

            {/* {showEndDatePicker && (
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
                            setShowEndDatePicker(false);
                        }
                    }
                />
            )} */}

            {/* {showEndTimePicker && (
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
                            setShowEndTimePicker(false);
                        }
                    }
                />
            )} */}
        </ScrollView>
    )
}

const EventDetails = ({ navigation, }: NativeStackScreenProps<EventsStackParams>) => {
    return (
        <SafeAreaView>

        </SafeAreaView>
    )
}


export default CreateEvent;