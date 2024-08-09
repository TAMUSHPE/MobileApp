import { View, Text, TouchableOpacity, TextInput, Alert, TouchableHighlight, Platform, Image, useColorScheme } from 'react-native';
import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/core';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/navigation';
import { Timestamp } from 'firebase/firestore';
import InteractButton from '../../components/InteractButton';
import { UserContext } from '../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CommonMimeTypes, MillisecondTimes, validateFileBlob } from '../../helpers';
import { formatDate, formatTime } from '../../helpers/timeUtils';
import { getBlobFromURI, selectImage } from '../../api/fileSelection';
import * as ImagePicker from "expo-image-picker";
import { auth } from '../../config/firebaseConfig';
import ProgressBar from '../../components/ProgressBar';
import { StatusBar } from 'expo-status-bar';
import { uploadFile } from '../../api/firebaseUtils';

const SetGeneralEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    // UI Hooks
    const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
    const [localImageURI, setLocalImageURI] = useState<string>();
    const [isUploading, setIsUploading] = useState<boolean>();
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [bytesTransferred, setBytesTransferred] = useState<number>();
    const [totalBytes, setTotalBytes] = useState<number>();

    // Form Data Hooks
    const [name, setName] = useState<string>("");
    const [startTime, setStartTime] = useState<Timestamp | undefined>(event.startTime ?? undefined);
    const [endTime, setEndTime] = useState<Timestamp | undefined>(event.endTime ?? undefined);
    const [description, setDescription] = useState<string>("");
    const [coverImageURI, setCoverImageURI] = useState<string>();

    const selectCoverImage = async () => {
        const result = await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        })

        if (result) {
            const imageBlob = await getBlobFromURI(result.assets![0].uri);
            if (imageBlob && validateFileBlob(imageBlob, CommonMimeTypes.IMAGE_FILES, true)) {
                setLocalImageURI(result.assets![0].uri);
                if (!imageBlob) return;
                setIsUploading(true);
                uploadFile(
                    imageBlob!,
                    CommonMimeTypes.IMAGE_FILES,
                    `events/cover-images/${auth.currentUser?.uid.toString()}${Date.now().toString()}`,
                    onImageUploadSuccess,
                );
            }
        }
    }

    const onImageUploadSuccess = async (URL: string) => {
        setCoverImageURI(URL);
        setIsUploading(false);
    }

    if (!event) return (
        <SafeAreaView className='flex flex-col items-center justify-center h-full w-screen'>
            <Text className='mb-10'>An issue ocurred while trying to load this page</Text>
            <InteractButton
                label='Back to Previous Page'
                onPress={() => navigation.goBack()}
            />
        </SafeAreaView>
    )

    return (
        <View>
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
                    <StatusBar style={darkMode ? "light" : "dark"} />
                    {/* Header */}
                    <View className='flex-row items-center'>
                        <View className='absolute w-full justify-center items-center'>
                            <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>General Details</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                            <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View className={`flex-1`}>
                        {/* Cover Image */}
                        {localImageURI === undefined ?
                            <TouchableOpacity
                                className={`my-2 mx-4 mt-4 rounded-2xl h-40 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                                onPress={() => selectCoverImage()}
                            >
                                <View
                                    className='border-2 border-primary-blue rounded-md'
                                    style={{ borderStyle: 'dashed' }}
                                >
                                    <View className='items-center justify-center h-full'>
                                        <FontAwesome name="camera" size={40} color="#1870B8" />
                                        <Text className='mt-1 text-center text-primary-blue text-lg font-semibold'>UPLOAD</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                            :
                            <TouchableOpacity className='flex flex-row justify-center mx-4 mt-4' onPress={() => selectCoverImage()}>
                                <Image source={{ uri: localImageURI as string }} className='rounded-2xl h-40 w-full' />

                                <TouchableOpacity
                                    className="absolute -right-2 -top-3  rounded-full w-8 h-8 justify-center items-center"
                                    style={{ backgroundColor: 'rgba(128,128,128,0.7)' }}
                                    onPress={() => {
                                        setLocalImageURI(undefined);
                                        setCoverImageURI(undefined);
                                    }}
                                >
                                    <Octicons name="x" size={25} color="red" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        }

                        {isUploading &&
                            <View className='flex flex-col items-center pt-2'>
                                <ProgressBar progress={uploadProgress} />
                                <Text className={darkMode ? "text-white" : "text-black"}>
                                    {`${((bytesTransferred ?? 0) / 1000000).toFixed(2)} / ${((totalBytes ?? 0) / 1000000).toFixed(2)} MB`}
                                </Text>
                            </View>
                        }

                        {/* Event Name */}
                        <View className='mt-6 mx-4'>
                            <Text className={`mb-1 text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                                Event Name<Text className='text-[#f00]'>*</Text>
                            </Text>

                            <TextInput
                                className={`text-lg p-2 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                                value={name}
                                placeholder='What is this event called?'
                                placeholderTextColor={darkMode ? "#DDD" : "#777"}
                                onChangeText={(text) => setName(text)}
                                keyboardType='ascii-capable'
                                enterKeyHint='enter'
                            />
                        </View>

                        {/* Start Time Selection Buttons */}
                        <View className='flex-row mt-6 mx-4'>
                            <View className='flex-col w-[60%]'>
                                <Text className={`justify-center mb-1 text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                                    Start Date<Text className='text-[#f00]'>*</Text>
                                </Text>
                                <View className='flex-row'>
                                    <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
                                    {Platform.OS == 'android' &&
                                        <View className='flex-row items-center'>
                                            <TouchableHighlight
                                                underlayColor={darkMode ? "" : "#EEE"}
                                                onPress={() => setShowStartDatePicker(true)}
                                                className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                                            >
                                                <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{startTime ? formatDate(startTime.toDate()) : "No date picked"}</Text>
                                            </TouchableHighlight>

                                            <TouchableHighlight
                                                underlayColor={darkMode ? "" : "#EEE"}
                                                onPress={() => setShowStartTimePicker(true)}
                                                className={`flex flex-row justify-between p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                            >
                                                <>
                                                    <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{startTime ? formatTime(startTime.toDate()) : "No date picked"}</Text>
                                                    <Octicons name='chevron-down' size={24} />
                                                </>
                                            </TouchableHighlight>
                                        </View>
                                    }

                                    {Platform.OS == 'ios' &&
                                        <View className='flex-row items-center'>
                                            <DateTimePicker
                                                themeVariant={darkMode ? 'dark' : 'light'}
                                                testID='Start Time Picker'
                                                value={startTime?.toDate() ?? new Date()}
                                                minimumDate={new Date(Date.now())}
                                                maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                                                mode='date'
                                                onChange={(_, date) => {
                                                    if (!date) {
                                                        console.warn("Date picked is undefined.")
                                                    }
                                                    else {
                                                        setStartTime(Timestamp.fromDate(date));
                                                        if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                                                            setEndTime(Timestamp.fromMillis(date.getTime() + MillisecondTimes.HOUR));
                                                        }
                                                    }
                                                    setShowStartDatePicker(false);
                                                }}
                                            />

                                            <DateTimePicker
                                                themeVariant={darkMode ? 'dark' : 'light'}
                                                value={startTime?.toDate() ?? new Date()}
                                                mode='time'
                                                onChange={(_, date) => {
                                                    if (isUploading) {
                                                        Alert.alert("Image upload in progress.", "Please wait for image to finish uploading.")
                                                    }
                                                    else if (!date) {
                                                        console.warn("Date picked is undefined.")
                                                    }
                                                    else if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                                                        Alert.alert("Invalid Start Time", "Event cannot start after end time.")
                                                    }
                                                    else {
                                                        setStartTime(Timestamp.fromDate(date));
                                                    }
                                                }}
                                            />
                                        </View>
                                    }

                                </View>
                            </View>
                        </View>

                        {/* End Time Selection Buttons */}
                        <View className='flex flex-row mt-3 mx-4'>
                            <View className='flex flex-col w-[60%]'>
                                <Text className={`justify-center mb-1 text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                                    End Date<Text className='text-[#f00]'>*</Text>
                                </Text>

                                <View className='flex-row items-center'>
                                    <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
                                    {Platform.OS == 'android' &&
                                        <View className='flex-row items-center'>
                                            <TouchableHighlight
                                                underlayColor={darkMode ? "" : "#EEE"}
                                                onPress={() => setShowEndDatePicker(true)}
                                                className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                            >
                                                <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{endTime ? formatDate(endTime.toDate()) : "No date picked"}</Text>
                                            </TouchableHighlight>

                                            <TouchableHighlight
                                                underlayColor={darkMode ? "" : "#EEE"}
                                                onPress={() => setShowEndTimePicker(true)}
                                                className={`flex flex-row justify-between p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                            >
                                                <>
                                                    <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{endTime ? formatTime(endTime.toDate()) : "No date picked"}</Text>
                                                    <Octicons name='chevron-down' size={24} />
                                                </>
                                            </TouchableHighlight>
                                        </View>
                                    }

                                    {Platform.OS == 'ios' &&
                                        <View className='flex flex-row items-center'>
                                            <DateTimePicker
                                                themeVariant={darkMode ? 'dark' : 'light'}
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
                                                }}
                                            />

                                            <DateTimePicker
                                                themeVariant={darkMode ? 'dark' : 'light'}
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
                                        </View>
                                    }
                                </View>
                            </View>
                        </View>

                        {/* Description */}
                        <View className='mt-6 mx-4'>
                            <Text className={`mb-1 text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>Description</Text>
                            <TextInput
                                className={`text-lg p-2 h-32 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                                value={description}
                                placeholder='What is this event about?'
                                placeholderTextColor={darkMode ? "#DDD" : "#777"}
                                onChangeText={(text: string) => {
                                    if (text.length <= 250)
                                        setDescription(text)
                                }}
                                numberOfLines={2}
                                keyboardType='ascii-capable'
                                autoCapitalize='sentences'
                                multiline
                                style={{ textAlignVertical: 'top' }}
                                enterKeyHint='enter'
                            />
                        </View>

                        <View className='w-full absolute bottom-0 mb-12'>
                            <InteractButton
                                buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                                textClassName='text-center text-white text-2xl font-bold'
                                underlayColor="#468DC6"
                                label='Next'
                                onPress={() => {
                                    if (!name) {
                                        Alert.alert("Empty Name", "Event must have a name!")
                                    }
                                    else if (!startTime || !endTime) {
                                        Alert.alert("Empty Start Time or End Time", "Event MUST have start and end times.")
                                    }
                                    else if (startTime.toMillis() > endTime.toMillis()) {
                                        Alert.alert("Event ends before start time", "Event cannot end before it starts.")
                                    }
                                    else if (event.copyFromObject) {
                                        let modifiedDescription = description.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim(); // Remove all newlines and extra spaces

                                        event.copyFromObject({
                                            name,
                                            startTime,
                                            endTime,
                                            description: modifiedDescription,
                                            coverImageURI,
                                            creator: auth.currentUser?.uid,
                                        });
                                        navigation.navigate("SetSpecificEventDetails", { event })
                                    }
                                    else {
                                        Alert.alert("Something has gone wrong", "Event data is malformed.");
                                        console.error("copsyFromObject() doe not exist on given event object. This means the given SHPEEvent object may be malformed. Please ensure that the object passed into parameters is an instance of a template class SHPEEvent.");
                                    }
                                }}
                            />
                            <View className='w-full items-center justify-center'>
                                <Text> General details can be changed later</Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAwareScrollView>

            {/* Start Date Pickers */}
            {Platform.OS == 'android' && showStartDatePicker &&
                <DateTimePicker
                    testID='Start Date Picker'
                    value={startTime?.toDate() ?? new Date()}
                    minimumDate={new Date(Date.now())}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='date'
                    onChange={(_, date) => {
                        if (!date) {
                            console.warn("Date picked is undefined.");
                        }
                        else {
                            setStartTime(Timestamp.fromDate(date));
                            if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                                setEndTime(Timestamp.fromMillis(date.getTime() + MillisecondTimes.HOUR));
                            }
                        }
                        setShowStartDatePicker(false);
                    }}
                />
            }
            {Platform.OS == 'android' && showStartTimePicker &&
                <DateTimePicker
                    testID='Start Time Picker'
                    value={startTime?.toDate() ?? new Date()}
                    mode='time'
                    onChange={(_, date) => {
                        if (isUploading) {
                            Alert.alert("Image upload in progress.", "Please wait for image to finish uploading.")
                        }
                        else if (!date) {
                            console.warn("Date picked is undefined.")
                        }
                        else if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                            Alert.alert("Invalid Start Time", "Event cannot start after end time.")
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
        </View>
    );
};

export default SetGeneralEventDetails;
