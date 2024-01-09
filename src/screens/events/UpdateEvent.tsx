import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, TouchableHighlight, KeyboardAvoidingView } from 'react-native'
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
import { formatDate, formatTime } from '../../helpers/timeUtils';

const UpdateEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const [updatedEvent, setUpdatedEvent] = useState<SHPEEvent>(event);
    const [updated, setUpdated] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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
                    <View className='w-full'>
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

                    {/* Start Time Selection Buttons */}
                    <View className='flex flex-row py-3'>
                        <View className='flex flex-col w-[60%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Start Date <Text className='text-[#f00]'>*</Text></Text>
                            {Platform.OS == 'android' &&
                                <TouchableHighlight
                                    underlayColor={darkMode ? "" : "#EEE"}
                                    onPress={() => setShowStartDatePicker(true)}
                                    className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                >
                                    <>
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{event.startTime ? formatDate(event.startTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
                                    </>
                                </TouchableHighlight>
                            }
                        </View>
                        <View className='flex flex-col w-[40%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Start Time <Text className='text-[#f00]'>*</Text></Text>
                            {Platform.OS == 'android' &&
                                <TouchableHighlight
                                    underlayColor={darkMode ? "" : "#EEE"}
                                    onPress={() => setShowStartTimePicker(true)}
                                    className={`flex flex-row justify-between p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                >
                                    <>
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{event.startTime ? formatTime(event.startTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='chevron-down' size={24} />
                                    </>
                                </TouchableHighlight>
                            }
                        </View>
                    </View>

                    {/* End Time Selection Buttons */}
                    <View className='flex flex-row pb-3'>
                        <View className='flex flex-col w-[60%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>End Date <Text className='text-[#f00]'>*</Text></Text>
                            {Platform.OS == 'android' &&
                                <TouchableHighlight
                                    underlayColor={darkMode ? "" : "#EEE"}
                                    onPress={() => setShowEndDatePicker(true)}
                                    className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                >
                                    <>
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{event.endTime ? formatDate(event.endTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
                                    </>
                                </TouchableHighlight>
                            }
                        </View>
                        <View className='flex flex-col w-[40%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>End Time <Text className='text-[#f00]'>*</Text></Text>
                            {Platform.OS == 'android' &&
                                <TouchableHighlight
                                    underlayColor={darkMode ? "" : "#EEE"}
                                    onPress={() => setShowEndTimePicker(true)}
                                    className={`flex flex-row justify-between p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                >
                                    <>
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{event.endTime ? formatTime(event.endTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='chevron-down' size={24} />
                                    </>
                                </TouchableHighlight>
                            }
                        </View>
                    </View>
                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Description</Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={event.description ?? ""}
                            placeholder='What is this event about?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(description) => setUpdatedEvent({ ...updatedEvent, description })}
                            numberOfLines={2}
                            keyboardType='ascii-capable'
                            autoCapitalize='sentences'
                            multiline
                            style={{ textAlignVertical: 'top' }}
                            enterKeyHint='enter'
                        />
                    </KeyboardAvoidingView>
                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Cover Image</Text>
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