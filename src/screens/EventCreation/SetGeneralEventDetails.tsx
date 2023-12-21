import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, TouchableHighlight, KeyboardAvoidingView, Modal, Platform } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { useRoute } from '@react-navigation/core';
import { Timestamp } from 'firebase/firestore';
import InteractButton from '../../components/InteractButton';
import { UserContext } from '../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MillisecondTimes } from '../../helpers';
import { formatDate, formatTime } from '../../helpers/timeUtils';

const SetGeneralEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    // UI Hooks
    const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

    // Form Data Hooks
    const [name, setName] = useState<string>("");
    const [startTime, setStartTime] = useState<Timestamp | undefined>(event.startTime);
    const [endTime, setEndTime] = useState<Timestamp | undefined>(event.endTime);
    const [description, setDescription] = useState<string>("");

    if (!event) return (
        <SafeAreaView className='flex flex-col items-center justify-center h-full w-screen'>
            <Text className='mb-10'>An issue occured while trying to load this page</Text>
            <InteractButton
                label='Back to Previous Page'
                onPress={() => navigation.goBack()}
            />
        </SafeAreaView>
    )

    return (
        <>
            {/* Start Date Pickers */}
            {Platform.OS == 'android' && showStartDatePicker &&
                <DateTimePicker
                    testID='Start Time Picker'
                    value={startTime?.toDate() ?? new Date()}
                    minimumDate={new Date(Date.now())}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='date'
                    onChange={(_, date) => {
                        if (!date) {
                            console.warn("Date picked is undefined.")
                        }
                        else if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                            Alert.alert("Invalid Start Time", "Event cannot start after end date.")
                        }
                        else {
                            setStartTime(Timestamp.fromDate(date));
                        }
                        setShowStartDatePicker(false);
                    }}
                />
            }
            {Platform.OS == 'android' && showStartTimePicker &&
                <DateTimePicker
                    value={startTime?.toDate() ?? new Date()}
                    mode='time'
                    onChange={(_, date) => {
                        if (!date) {
                            console.warn("Date picked is undefined.")
                        }
                        else if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                            Alert.alert("Invalid Start Time", "Event cannot stard after end time.")
                        }
                        else {
                            setStartTime(Timestamp.fromDate(date));
                        }
                        setShowStartTimePicker(false);
                    }}
                />
            }


            {/* End Date Pickers */}
            {Platform.OS == 'android' && showEndDatePicker &&
                <DateTimePicker
                    testID='Start Time Picker'
                    value={endTime?.toDate() ?? new Date()}
                    minimumDate={new Date(Date.now())}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='date'
                    onChange={(_, date) => {
                        if (!date) {
                            console.warn("Date picked is undefined.")
                        }
                        else if (startTime && date.valueOf() < startTime?.toDate().valueOf()) {
                            Alert.alert("Invalid End Date", "Event cannot end before start date.")
                        }
                        else {
                            setEndTime(Timestamp.fromDate(date));
                        }
                        setShowEndDatePicker(false);
                    }}
                />
            }
            {Platform.OS == 'android' && showEndTimePicker &&
                <DateTimePicker
                    value={endTime?.toDate() ?? new Date()}
                    mode='time'
                    onChange={(_, date) => {
                        if (!date) {
                            console.warn("Date picked is undefined.")
                        }
                        else if (startTime && date.valueOf() < startTime?.toDate().valueOf()) {
                            Alert.alert("Invalid End Time", "Event cannot end before start time.")
                        }
                        else {
                            setEndTime(Timestamp.fromDate(date));
                        }
                        setShowEndTimePicker(false);
                    }}
                />
            }

            <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                {/* Header */}
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>{event.eventType} Info</Text>
                    </View>
                    <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                {/* Form */}
                <ScrollView className={`flex flex-col px-4 flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`}>

                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Event Name <Text className='text-[#f00]'>*</Text></Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={name}
                            placeholder='What is this event called?'
                            onChangeText={(text) => setName(text)}
                            keyboardType='ascii-capable'
                            autoFocus
                            enterKeyHint='enter'
                        />
                    </KeyboardAvoidingView>

                    {/* Start Time Selection Buttons */}
                    <View className='flex flex-row py-3'>
                        <View className='flex flex-col w-[60%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Start Date <Text className='text-[#f00]'>*</Text></Text>
                            <TouchableHighlight
                                underlayColor={darkMode ? "" : "#EEE"}
                                onPress={() => setShowStartDatePicker(true)}
                                className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            >
                                <>
                                    <Text className={`text-base`}>{startTime ? formatDate(startTime.toDate()) : "No date picked"}</Text>
                                    <Octicons name='calendar' size={24} />
                                </>
                            </TouchableHighlight>
                        </View>
                        <View className='flex flex-col w-[40%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Start Time <Text className='text-[#f00]'>*</Text></Text>
                            <TouchableHighlight
                                underlayColor={darkMode ? "" : "#EEE"}
                                onPress={() => setShowStartTimePicker(true)}
                                className={`flex flex-row justify-between p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            >
                                <>
                                    <Text className={`text-base`}>{startTime ? formatTime(startTime.toDate()) : "No date picked"}</Text>
                                    <Octicons name='chevron-down' size={24} />
                                </>
                            </TouchableHighlight>
                        </View>
                    </View>

                    {/* End Time Selection Buttons */}
                    <View className='flex flex-row pb-3'>
                        <View className='flex flex-col w-[60%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>End Date <Text className='text-[#f00]'>*</Text></Text>
                            <TouchableHighlight
                                underlayColor={darkMode ? "" : "#EEE"}
                                onPress={() => setShowEndDatePicker(true)}
                                className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            >
                                <>
                                    <Text className={`text-base`}>{endTime ? formatDate(endTime.toDate()) : "No date picked"}</Text>
                                    <Octicons name='calendar' size={24} />
                                </>
                            </TouchableHighlight>
                        </View>
                        <View className='flex flex-col w-[40%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>End Time <Text className='text-[#f00]'>*</Text></Text>
                            <TouchableHighlight
                                underlayColor={darkMode ? "" : "#EEE"}
                                onPress={() => setShowEndTimePicker(true)}
                                className={`flex flex-row justify-between p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            >
                                <>
                                    <Text className={`text-base`}>{endTime ? formatTime(endTime.toDate()) : "No date picked"}</Text>
                                    <Octicons name='chevron-down' size={24} />
                                </>
                            </TouchableHighlight>
                        </View>
                    </View>

                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Description</Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={description}
                            placeholder='What is this event about?'
                            onChangeText={(text) => setDescription(text)}
                            keyboardType='ascii-capable'
                            autoCapitalize='sentences'
                            multiline
                            enterKeyHint='enter'
                        />
                    </KeyboardAvoidingView>

                    <InteractButton
                        buttonClassName='bg-orange mt-10 mb-4 py-1 rounded-xl'
                        textClassName='text-center text-black'
                        label='Next Step'
                        underlayColor='#f2aa96'
                        onPress={() => {
                            if (!name) {
                                Alert.alert("Empty Name", "Event must have a name!")
                            }
                            else if (!startTime || !endTime) {
                                Alert.alert("Empty Start Time or End Time", "Event MUST have start and end times.")
                            }
                            else if (event.copyFromObject) {
                                event.copyFromObject({
                                    name,
                                    startTime,
                                    endTime,
                                    description
                                });
                                navigation.navigate("SetSpecificEventDetails", { event })
                            }
                            else {
                                Alert.alert("Something has gone wrong", "Event data is malformed.");
                                console.error("copyFromObject() does not exist on given event object. This means the given SHPEEvent object may be malformed. Please ensure that the object passed into parameters is an instance of a template class SHPEEvent.");
                            }
                        }}
                    />
                    <Text className={`text-xl text-center pt-2 ${darkMode ? "text-white" : "text-black"}`}>Step 2 of 4</Text>
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

export default SetGeneralEventDetails;
