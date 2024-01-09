import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, TouchableHighlight, KeyboardAvoidingView, Platform, Image } from 'react-native';
import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { useRoute } from '@react-navigation/core';
import { Timestamp } from 'firebase/firestore';
import InteractButton from '../../components/InteractButton';
import { UserContext } from '../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CommonMimeTypes, MillisecondTimes, validateFileBlob } from '../../helpers';
import { formatDate, formatTime } from '../../helpers/timeUtils';
import { getBlobFromURI, selectImage } from '../../api/fileSelection';
import * as ImagePicker from "expo-image-picker";
import { uploadFileToFirebase } from '../../api/firebaseUtils';
import { auth } from '../../config/firebaseConfig';
import { UploadTask, getDownloadURL } from 'firebase/storage';
import ProgressBar from '../../components/ProgressBar';
import { StatusBar } from 'expo-status-bar';

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
    const [localImageURI, setLocalImageURI] = useState<string>();
    const [isUploading, setIsUploading] = useState<boolean>();
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [bytesTransferred, setBytesTransferred] = useState<number>();
    const [totalBytes, setTotalBytes] = useState<number>();
    const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask>();

    // Form Data Hooks
    const [name, setName] = useState<string>("");
    const [startTime, setStartTime] = useState<Timestamp | undefined>(event.startTime ?? undefined);
    const [endTime, setEndTime] = useState<Timestamp | undefined>(event.endTime ?? undefined);
    const [description, setDescription] = useState<string>("");
    const [coverImageURI, setCoverImageURI] = useState<string>();


    const selectCoverImage = async () => {
        await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        }).then(async (result) => {
            if (result) {
                const imageBlob = await getBlobFromURI(result.assets![0].uri);
                if (imageBlob && validateFileBlob(imageBlob, CommonMimeTypes.IMAGE_FILES, true)) {
                    setLocalImageURI(result.assets![0].uri);
                    uploadCoverImage(imageBlob);
                }
            }
        }).catch((err) => {
            // TypeError means user did not select an image
            if (err.name != "TypeError") {
                console.error(err);
            }
            else {
                setLocalImageURI(undefined);
            }
        });
    }

    const uploadCoverImage = (image: Blob | undefined) => {
        if (image) {
            setIsUploading(true);
            // Creates image in firebase cloud storage with unique name
            const uploadTask = uploadFileToFirebase(image, `events/cover-images/${auth.currentUser?.uid.toString()}${Date.now().toString()}`)
            setCurrentUploadTask(uploadTask);
            uploadTask.on("state_changed",
                (snapshot) => {
                    setUploadProgress(snapshot.bytesTransferred / snapshot.totalBytes);
                    setBytesTransferred(snapshot.bytesTransferred);
                    setTotalBytes(snapshot.totalBytes);
                },
                (error) => {
                    switch (error.code) {
                        case "storage/unauthorized":
                            Alert.alert("Permissions error", "File could not be uploaded due to user permissions (User likely not authenticated or logged in)");
                            break;
                        case "storage/canceled":
                            Alert.alert("File upload canceled", "File upload has been canceled.");
                            break;
                        default:
                            Alert.alert("Unknown error", "An unknown error has occured. Please notify a developer.")
                            console.error(error);
                            break;
                    }
                    setIsUploading(false);
                },
                async () => {
                    await getDownloadURL(uploadTask.snapshot.ref).then(async (URL) => {
                        console.log("File available at", URL);
                        setCoverImageURI(URL);
                    });
                    setIsUploading(false);
                }
            );
        }
        else {
            console.warn("No image was selected from image picker");
        }
    }

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
            <StatusBar style={darkMode ? "light" : "dark"} />
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
                <ScrollView
                    className={`flex flex-col px-4 flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`}
                    contentContainerStyle={{
                        paddingBottom: 60
                    }}
                >
                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Event Name <Text className='text-[#f00]'>*</Text></Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={name}
                            placeholder='What is this event called?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
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
                            {Platform.OS == 'android' &&
                                <TouchableHighlight
                                    underlayColor={darkMode ? "" : "#EEE"}
                                    onPress={() => setShowStartDatePicker(true)}
                                    className={`flex flex-row justify-between p-2 mr-4 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                >
                                    <>
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{startTime ? formatDate(startTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
                                    </>
                                </TouchableHighlight>
                            }
                            {Platform.OS == 'ios' &&
                                <View className='flex flex-row items-center'>
                                    <Octicons className='flex-1' name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
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
                                </View>
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
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{startTime ? formatTime(startTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='chevron-down' size={24} />
                                    </>
                                </TouchableHighlight>
                            }
                            {Platform.OS == 'ios' &&
                                <View className='flex flex-row items-center'>
                                    <Octicons name='clock' size={24} color={darkMode ? 'white' : 'black'} />
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
                                                Alert.alert("Invalid Start Time", "Event cannot stard after end time.")
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
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{endTime ? formatDate(endTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
                                    </>
                                </TouchableHighlight>
                            }
                            {Platform.OS == 'ios' &&
                                <View className='flex flex-row items-center'>
                                    <Octicons name='calendar' size={24} color={darkMode ? 'white' : 'black'} />
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
                                </View>
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
                                        <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{endTime ? formatTime(endTime.toDate()) : "No date picked"}</Text>
                                        <Octicons name='chevron-down' size={24} />
                                    </>
                                </TouchableHighlight>
                            }
                            {Platform.OS == 'ios' &&
                                <View className='flex flex-row items-center'>
                                    <Octicons name='clock' size={24} color={darkMode ? 'white' : 'black'} />
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

                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Description</Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={description}
                            placeholder='What is this event about?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text) => setDescription(text)}
                            numberOfLines={2}
                            keyboardType='ascii-capable'
                            autoCapitalize='sentences'
                            multiline
                            style={{ textAlignVertical: 'top' }}
                            enterKeyHint='enter'
                        />
                    </KeyboardAvoidingView>

                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Cover Image</Text>
                    {
                        localImageURI === undefined ?
                            <View className={`py-8 my-2 ${darkMode ? "text-white bg-gray-500" : "text-black bg-gray-100"}`}>
                                <Text className={`text-center ${darkMode ? "text-white" : "text-black"}`}>No Image Selected</Text>
                            </View> :
                            <View className='py-2 flex flex-row justify-center'>
                                <Image
                                    source={{ uri: localImageURI as string }}
                                    style={{
                                        width: 256,
                                        height: 144,
                                    }}
                                />
                            </View>
                    }
                    {
                        isUploading ?
                            <>
                                <InteractButton
                                    label='Cancel Upload'
                                    buttonClassName='bg-red-500 rounded-md'
                                    textClassName='text-center text-lg text-white'
                                    onPress={() => {
                                        currentUploadTask?.cancel()
                                        setLocalImageURI(undefined);
                                        setCoverImageURI(undefined);
                                    }}
                                />
                                <View className='flex flex-col items-center pt-2'>
                                    <ProgressBar
                                        progress={uploadProgress}
                                    />
                                    <Text className={darkMode ? "text-white" : "text-black"}>
                                        {`${((bytesTransferred ?? 0) / 1000000).toFixed(2)} / ${((totalBytes ?? 0) / 1000000).toFixed(2)} MB`}
                                    </Text>
                                </View>
                            </> :
                            <InteractButton
                                label='Upload Cover Image'
                                buttonClassName='bg-blue-200 rounded-md'
                                textClassName='text-center text-lg'
                                onPress={() => selectCoverImage()}
                            />
                    }
                    <InteractButton
                        buttonClassName='bg-orange mt-6 mb-4 py-1 rounded-xl'
                        textClassName='text-center text-white text-lg'
                        label='Next Step'
                        underlayColor='#f2aa96'
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
                                event.copyFromObject({
                                    name,
                                    startTime,
                                    endTime,
                                    description,
                                    coverImageURI,
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
