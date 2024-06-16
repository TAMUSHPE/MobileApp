import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, TouchableHighlight, KeyboardAvoidingView, Platform, Image, Switch } from 'react-native';
import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/navigation';
import { useRoute } from '@react-navigation/core';
import { Timestamp } from 'firebase/firestore';
import InteractButton from '../../components/InteractButton';
import { UserContext } from '../../context/UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CommonMimeTypes, MillisecondTimes, validateFileBlob } from '../../helpers';
import { formatDate, formatTime } from '../../helpers/timeUtils';
import { getBlobFromURI, selectImage } from '../../api/fileSelection';
import * as ImagePicker from "expo-image-picker";
import { auth } from '../../config/firebaseConfig';
import { UploadTask } from 'firebase/storage';
import ProgressBar from '../../components/ProgressBar';
import { StatusBar } from 'expo-status-bar';
import { uploadFile } from '../../api/firebaseUtils';

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
    const [isGeneral, setIsGeneral] = useState<boolean>(event.general ?? false);

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
                    setUploadProgress
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
            <Text className='mb-10'>An issue occured while trying to load this page</Text>
            <InteractButton
                label='Back to Previous Page'
                onPress={() => navigation.goBack()}
            />
        </SafeAreaView>
    )

    return (
        <View>
            <StatusBar style={darkMode ? "light" : "dark"} />
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

                {/* Steps */}
                <View className='flex-row mx-4 py-4 items-center justify-center flex-wrap'>
                    <View className='flex-row items-center justify-center'>
                        <View className='h-7 w-7 bg-pale-blue rounded-full' />
                        <Text className='text-pale-blue text-lg ml-1'>General</Text>
                    </View>

                    <View className='ml-3 h-[2px] w-5 bg-pale-blue' />

                    <View className='flex-row items-center justify-center ml-1'>
                        <View className='h-7 w-7 border border-gray-500 rounded-full' />
                        <Text className='text-gray-500 text-lg ml-1'>Specific</Text>
                    </View>

                    <View className='ml-3 h-[2px] w-5 bg-gray-500' />

                    <View className='flex-row items-center justify-center ml-1'>
                        <View className='h-7 w-7 border border-gray-500 rounded-full' />
                        <Text className='text-gray-500 text-lg ml-1'>Location</Text>
                    </View>
                </View>

                {/* Form */}
                <ScrollView
                    className={`flex flex-col px-4 flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`}
                    contentContainerStyle={{
                        paddingBottom: "50%"
                    }}
                >
                    <View className='mt-4'>
                        <Text className={`text-xl font-semibold${darkMode ? "text-white" : "text-black"}`}>Enter the basic details of your event</Text>
                    </View>
                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Event Name <Text className='text-[#f00]'>*</Text></Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={name}
                            placeholder='What is this event called?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text) => setName(text)}
                            keyboardType='ascii-capable'
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

                    {/* toggle to make events appear on general tab*/}
                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Event Scope</Text>
                        <View className="flex flex-row items-center justify-between py-2">
                            <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>Club-Wide Event</Text>
                            <Switch
                                trackColor={{ false: "#999796", true: "#001F5B" }}
                                thumbColor={isGeneral ? "#72A9BE" : "#f4f3f4"}
                                ios_backgroundColor="#999796"
                                onValueChange={() => setIsGeneral(previousState => !previousState)}
                                value={isGeneral}
                            />
                        </View>
                    </KeyboardAvoidingView>

                    <KeyboardAvoidingView className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Description</Text>
                        <TextInput
                            className={`h-32 text-lg p-2 rounded-md ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
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
                    </KeyboardAvoidingView>

                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Cover Image</Text>
                    {localImageURI === undefined ?
                        <TouchableOpacity
                            className={`my-2 rounded-2xl h-32 ${darkMode ? "bg-gray-500" : "text-black bg-gray-100"}`}
                            onPress={() => selectCoverImage()}
                        >
                            <View className='border-2 border-pale-blue rounded-2xl'
                                style={{ borderStyle: 'dashed' }}
                            >
                                <View className='items-center justify-center h-full'>
                                    <FontAwesome name="camera" size={40} color="#72A9BE" />
                                    <Text className='text-center text-pale-blue text-lg'>UPLOAD</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        :
                        <TouchableOpacity
                            className='flex flex-row justify-center'
                            onPress={() => selectCoverImage()}
                        >
                            <Image
                                source={{ uri: localImageURI as string }}
                                className='rounded-2xl'
                                style={{
                                    width: 256 * 1.3,
                                    height: 144 * 1.3,
                                }}
                            />

                            <TouchableOpacity
                                className="absolute right-0 rounded-full w-8 h-8 justify-center items-center bg-gray-300"
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

                    <InteractButton
                        buttonClassName='bg-pale-blue mt-5 mb-4 py-1 rounded-xl w-1/2 mx-auto'
                        textClassName='text-center text-white text-lg font-bold'
                        label='Next Step'
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
                                    general: isGeneral
                                });
                                navigation.navigate("SetSpecificEventDetails", { event })
                            }
                            else {
                                Alert.alert("Something has gone wrong", "Event data is malformed.");
                                console.error("copyFromObject() does not exist on given event object. This means the given SHPEEvent object may be malformed. Please ensure that the object passed into parameters is an instance of a template class SHPEEvent.");
                            }
                        }}
                    />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default SetGeneralEventDetails;
