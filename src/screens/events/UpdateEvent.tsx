import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, TouchableHighlight, KeyboardAvoidingView, Modal, ActivityIndicator, Alert } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommitteeMeeting, EventType, GeneralMeeting, IntramuralEvent, CustomEvent, monthNames, SHPEEvent, SocialEvent, StudyHours, VolunteerEvent, Workshop, WorkshopType } from '../../types/Events';
import { destroyEvent, getCommittees, setEvent, uploadFileToFirebase } from '../../api/firebaseUtils';
import { Octicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images } from '../../../assets';
import { Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';
import { MillisecondTimes, formatDate, formatTime } from '../../helpers/timeUtils';
import { StatusBar } from 'expo-status-bar';
import DismissibleModal from '../../components/DismissibleModal';
import { UploadTask, getDownloadURL } from 'firebase/storage';
import InteractButton from '../../components/InteractButton';
import { getBlobFromURI, selectImage } from '../../api/fileSelection';
import * as ImagePicker from "expo-image-picker";
import { CommonMimeTypes, validateFileBlob } from '../../helpers';
import ProgressBar from '../../components/ProgressBar';
import { auth } from '../../config/firebaseConfig';
import { Committee } from '../../types/Committees';

const UpdateEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const [selectableCommittees, setSelectableCommittees] = useState<Committee[]>([]);


    // UI Hooks
    const [updated, setUpdated] = useState<boolean>(false);
    const [changesMade, setChangesMade] = useState<boolean>(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showDeletionConfirmation, setShowDeletionConfirmation] = useState<boolean>(false);
    const [currentUploadTask, setCurrentUploadTask] = useState<UploadTask>();
    const [isUploading, setIsUploading] = useState<boolean>();
    const [localImageURI, setLocalImageURI] = useState<string>();
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [bytesTransferred, setBytesTransferred] = useState<number>();
    const [totalBytes, setTotalBytes] = useState<number>();

    // Form Data Hooks
    const [name, setName] = useState<string | undefined | null>(event.name);
    const [description, setDescription] = useState<string | undefined | null>(event.description);
    const [tags, setTags] = useState<string[] | undefined | null>(event.tags);
    const [startTime, setStartTime] = useState<Timestamp | undefined | null>(event.startTime);
    const [endTime, setEndTime] = useState<Timestamp | undefined | null>(event.endTime);
    const [startTimeBuffer, setStartTimeBuffer] = useState<number | undefined | null>(event.startTimeBuffer);
    const [endTimeBuffer, setEndTimeBuffer] = useState<number | undefined | null>(event.endTimeBuffer);
    const [coverImageURI, setCoverImageURI] = useState<string | undefined | null>(event.coverImageURI);
    const [signInPoints, setSignInPoints] = useState<number | undefined | null>(event.signInPoints);
    const [signOutPoints, setSignOutPoints] = useState<number | undefined | null>(event.signOutPoints);
    const [pointsPerHour, setPointsPerHour] = useState<number | undefined | null>(event.pointsPerHour);
    const [locationName, setLocationName] = useState<string | undefined | null>(event.locationName);
    const [geolocation, setGeolocation] = useState<Geolocation | undefined | null>(event.geolocation);
    const [workshopType, setWorkshopType] = useState<WorkshopType | undefined>(event.workshopType);
    const [committee, setCommittee] = useState<string | undefined | null>(event.committee);

    useEffect(() => {
        getCommittees()
            .then((result) => setSelectableCommittees(result))
            .catch(err => console.error("Issue getting committees:", err));
    }, []);

    const handleUpdateEvent = async () => {
        setLoading(true);

        let updatedEvent: SHPEEvent = {};
        switch (event.eventType) {
            case EventType.GENERAL_MEETING:
                updatedEvent = new GeneralMeeting();
                break;
            case EventType.COMMITTEE_MEETING:
                updatedEvent = new CommitteeMeeting();
                break;
            case EventType.STUDY_HOURS:
                updatedEvent = new StudyHours();
                break;
            case EventType.WORKSHOP:
                updatedEvent = new Workshop();
                break;
            case EventType.VOLUNTEER_EVENT:
                updatedEvent = new VolunteerEvent();
                break;
            case EventType.SOCIAL_EVENT:
                updatedEvent = new SocialEvent();
                break;
            case EventType.INTRAMURAL_EVENT:
                updatedEvent = new IntramuralEvent();
                break;
            case EventType.CUSTOM_EVENT:
                updatedEvent = new CustomEvent();
                break;
            default:
                console.warn(`Event type ${event.eventType} not handled. This may cause issues if given event object does not follow SHPEEvent schema.`)
                break;
        }

        // Uses spread syntax as fallback in case class does not implement copyFromObject
        if (updatedEvent.copyFromObject) {
            updatedEvent.copyFromObject(event);
        }
        else {
            updatedEvent = { ...event };
        }

        if (updatedEvent.copyFromObject) {
            updatedEvent.copyFromObject({
                name,
                description,
                tags,
                startTime,
                endTime,
                startTimeBuffer,
                endTimeBuffer,
                coverImageURI,
                signInPoints,
                signOutPoints,
                pointsPerHour,
                locationName,
                geolocation,
                workshopType,
                committee,
            })
        }

        const eventID = await setEvent(event.id!, updatedEvent)
            .then((eventID) => {
                setLoading(false);
                return eventID;
            });

        if (eventID) {
            setUpdated(true);
            setChangesMade(false);
        }
        else {
            console.log('Event update failed');
        }
    }

    const handleDestroyEvent = async () => {
        const isDeleted = await destroyEvent(event.id!);
        if (isDeleted) {
            navigation.navigate("EventsScreen")
        } else {
            console.log("Failed to delete the event.");
        }
    }

    const selectCoverImage = async () => {
        await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
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

    return (
        <View>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <Modal
                visible={loading}
                transparent
            >
                <View className='h-full flex justify-center items-center'>
                    <ActivityIndicator size={90} />
                </View>
            </Modal>
            <DismissibleModal
                visible={showDeletionConfirmation}
                setVisible={setShowDeletionConfirmation}
            >
                <View className={`flex flex-col rounded-md p-3 space-y-6 w-[80%] h-[30%] ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
                    <Text className='text-lg h-[60%]'>Are you <Text className='italic'>sure</Text> that you want to destroy this event?{'\n\nNote: This is *not* reversable!'}</Text>
                    <View className='flex flex-row flex-1 space-x-2'>
                        <TouchableHighlight
                            className='rounded-md flex flex-col justify-center items-center flex-1 h-full bg-[#ff1c1c]'
                            underlayColor={'#b30000'}
                            onPress={() => {
                                setShowDeletionConfirmation(false);
                                setLoading(true);
                                handleDestroyEvent().then(() => setLoading(false));
                            }}
                        >
                            <Text className={`text-center text-white text-xl`}><Octicons name='repo-deleted' size={20} /> Delete</Text>
                        </TouchableHighlight>
                        <TouchableHighlight
                            className={`rounded-md flex flex-col justify-center items-center flex-1 h-full ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}
                            underlayColor={darkMode ? "" : ""}
                            onPress={() => setShowDeletionConfirmation(false)}
                        >
                            <Text className={`text-center text-xl ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
                        </TouchableHighlight>
                    </View>
                </View>
            </DismissibleModal>

            {/* Start Date Pickers */}
            {Platform.OS == 'android' && showStartDatePicker &&
                <DateTimePicker
                    testID='Start Date Picker'
                    value={startTime?.toDate() ?? new Date()}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='date'
                    onChange={(_, date) => {
                        setShowStartDatePicker(false);
                        if (!date) {
                            console.warn("Date picked is undefined.");
                        }
                        else if (endTime && date.valueOf() > endTime.toMillis()) {
                            setStartTime(Timestamp.fromDate(date));
                            setEndTime(Timestamp.fromMillis(date.getTime() + MillisecondTimes.HOUR));
                        }
                        else {
                            setStartTime(Timestamp.fromDate(date));
                        }
                        setChangesMade(true);
                    }}
                />
            }
            {Platform.OS == 'android' && showStartTimePicker &&
                <DateTimePicker
                    testID='Start Time Picker'
                    value={startTime?.toDate() ?? new Date()}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='time'
                    onChange={(_, date) => {
                        setShowStartTimePicker(false);
                        if (!date) {
                            console.warn("Date picked is undefined.");
                        }
                        else if (endTime && date.valueOf() > endTime.toMillis()) {
                            setStartTime(Timestamp.fromDate(date));
                            setEndTime(Timestamp.fromMillis(date.getTime() + MillisecondTimes.HOUR));
                        }
                        else {
                            setStartTime(Timestamp.fromDate(date));
                        }
                        setChangesMade(true);
                    }}
                />
            }

            {/* End Date Pickers */}
            {Platform.OS == 'android' && showEndDatePicker &&
                <DateTimePicker
                    testID='End Date Picker'
                    value={endTime?.toDate() ?? new Date()}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='date'
                    onChange={(_, date) => {
                        setShowEndDatePicker(false);
                        if (!date) {
                            console.warn("Date picked is undefined.");
                        }
                        else if (startTime && startTime.toMillis() > date.valueOf()) {
                            Alert.alert("Invalid End Date", "Event cannot end before start time")
                        }
                        else {
                            setEndTime(Timestamp.fromDate(date));
                        }
                        setChangesMade(true);
                    }}
                />
            }
            {Platform.OS == 'android' && showEndTimePicker &&
                <DateTimePicker
                    testID='End Time Picker'
                    value={endTime?.toDate() ?? new Date()}
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + MillisecondTimes.YEAR)}
                    mode='time'
                    onChange={(_, date) => {
                        setShowEndTimePicker(false);
                        if (!date) {
                            console.warn("Date picked is undefined.");
                        }
                        else if (startTime && startTime.toMillis() > date.valueOf()) {
                            Alert.alert("Invalid End Date", "Event cannot end before start time")
                        }
                        else {
                            setEndTime(Timestamp.fromDate(date));
                        }
                        setChangesMade(true);
                    }}
                />
            }


            <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                <ScrollView
                    className={`flex flex-col flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
                    contentContainerStyle={{
                        paddingBottom: "80%"
                    }}
                >
                    {/* Header */}
                    <View className={`flex-row items-center h-10 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>{event.name}{changesMade && ' *'}</Text>
                        </View>
                        <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                            <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    <View className="mt-2 pl-6">
                        <Text className={`text-xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Update Event</Text>
                    </View>

                    {/* Image */}
                    <View className='justify-center items-center'>
                        <Image
                            className="mt-2 h-60 w-[90%] bg-gray-700 rounded-xl"
                            source={localImageURI ? { uri: localImageURI } : event.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                        />
                    </View>

                    <View className='flex-row w-screen justify-center items-center pt-6 space-x-7'>
                        <TouchableOpacity className='w-20 h-10 bg-blue-400 justify-center items-center rounded-md'
                            onPress={() => handleUpdateEvent()}
                        >
                            <Text className='text-white'>Update Event</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className='w-20 h-10 bg-blue-300 justify-center items-center rounded-md'
                            onPress={() => navigation.navigate("QRCode", { event: event })}
                        >
                            <Text>View QRCode</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className='w-20 h-10 bg-red-400 justify-center items-center rounded-md'
                            onPress={() => setShowDeletionConfirmation(true)}
                        >
                            <Text>Destroy Event</Text>
                        </TouchableOpacity>
                    </View>
                    {updated && <Text className='pt-3 text-green-500 text-lg text-center'>Information has been updated</Text>}

                    {/* Form */}
                    <View className='mt-9 px-6 space-y-1'>
                        <View className='w-full'>
                            <Text className={darkMode ? "text-gray-100" : "text-gray-500"}>Event Name</Text>
                            <View className='flex-row border-b-2 border-slate-400'>
                                <TextInput
                                    className={`w-[90%] rounded-md text-xl py-1 ${name ? 'font-normal' : 'font-extrabold'}`}
                                    value={name ?? ""}
                                    onChangeText={(text) => {
                                        setName(text);
                                        setChangesMade(true);
                                    }}
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
                                            <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{startTime ? formatDate(startTime.toDate()) : "No date picked"}</Text>
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
                                            <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{startTime ? formatTime(startTime.toDate()) : "No date picked"}</Text>
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
                                            <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{endTime ? formatDate(endTime.toDate()) : "No date picked"}</Text>
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
                                            <Text className={`text-base ${darkMode ? "text-white" : "text-black"}`}>{endTime ? formatTime(endTime.toDate()) : "No date picked"}</Text>
                                            <Octicons name='chevron-down' size={24} />
                                        </>
                                    </TouchableHighlight>
                                }
                            </View>
                        </View>
                        <KeyboardAvoidingView behavior='position' className='py-3'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Description</Text>
                            <TextInput
                                className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                                value={description ?? ""}
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
                            isUploading ?
                                <View>
                                    <InteractButton
                                        label='Cancel Upload'
                                        buttonClassName='bg-red-500 rounded-md'
                                        textClassName='text-center text-lg text-white'
                                        onPress={() => {
                                            currentUploadTask?.cancel()
                                            setLocalImageURI(undefined);
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
                                </View> :
                                <InteractButton
                                    label='Upload Cover Image'
                                    buttonClassName='bg-blue-200 rounded-md mb-3'
                                    textClassName='text-center text-lg'
                                    onPress={() => {
                                        selectCoverImage();
                                        setChangesMade(true);
                                    }}
                                />
                        }
                        {event.signInPoints !== undefined &&
                            <View>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing In <Text className='text-[#f00]'>*</Text></Text>
                                <KeyboardAvoidingView>
                                    <Picker
                                        mode='dropdown'
                                        selectedValue={signInPoints}
                                        onValueChange={(points) => setSignInPoints(points)}
                                        style={{ color: darkMode ? "white" : "black" }}
                                        selectionColor={darkMode ? "#FFF4" : "0004"}
                                        itemStyle={{
                                            color: darkMode ? "white" : "black"
                                        }}
                                        dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                                    >
                                        <Picker.Item label='0' value={0} />
                                        <Picker.Item label='1' value={1} />
                                        <Picker.Item label='2' value={2} />
                                        <Picker.Item label='3' value={3} />
                                        <Picker.Item label='4' value={4} />
                                        <Picker.Item label='5' value={5} />
                                    </Picker>
                                </KeyboardAvoidingView>
                            </View>
                        }
                        {
                            event.signOutPoints !== undefined &&
                            <View>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing Out <Text className='text-[#f00]'>*</Text></Text>
                                <KeyboardAvoidingView>
                                    <Picker
                                        mode='dropdown'
                                        selectedValue={signOutPoints}
                                        onValueChange={(points) => setSignOutPoints(points)}
                                        style={{ color: darkMode ? "white" : "black" }}
                                        selectionColor={darkMode ? "#FFF4" : "0004"}
                                        itemStyle={{
                                            color: darkMode ? "white" : "black"
                                        }}
                                        dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                                    >
                                        <Picker.Item label='0' value={0} />
                                        <Picker.Item label='1' value={1} />
                                        <Picker.Item label='2' value={2} />
                                        <Picker.Item label='3' value={3} />
                                        <Picker.Item label='4' value={4} />
                                        <Picker.Item label='5' value={5} />
                                    </Picker>
                                </KeyboardAvoidingView>
                            </View>
                        }
                        {
                            event.pointsPerHour !== undefined &&
                            <View>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Each Hour Signed In <Text className='text-[#f00]'>*</Text></Text>
                                <KeyboardAvoidingView>
                                    <Picker
                                        mode='dropdown'
                                        selectedValue={pointsPerHour}
                                        onValueChange={(points) => setPointsPerHour(points)}
                                        style={{ color: darkMode ? "white" : "black" }}
                                        selectionColor={darkMode ? "#FFF4" : "0004"}
                                        itemStyle={{
                                            color: darkMode ? "white" : "black"
                                        }}
                                        dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                                    >
                                        <Picker.Item label='0' value={0} />
                                        <Picker.Item label='1' value={1} />
                                        <Picker.Item label='2' value={2} />
                                        <Picker.Item label='3' value={3} />
                                        <Picker.Item label='4' value={4} />
                                        <Picker.Item label='5' value={5} />
                                    </Picker>
                                </KeyboardAvoidingView>
                            </View>
                        }
                        {event.workshopType !== undefined &&
                            <View>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Workshop Type <Text className='text-[#f00]'>*</Text></Text>
                                <Picker
                                    selectedValue={workshopType}
                                    onValueChange={(selectedWorkshopType: WorkshopType) => {
                                        setWorkshopType(selectedWorkshopType);
                                        switch (selectedWorkshopType) {
                                            case "Academic":
                                                setSignInPoints(2);
                                            case "Professional":
                                                setSignInPoints(3);
                                        }
                                    }}
                                    style={{ color: darkMode ? "white" : "black" }}
                                    selectionColor={darkMode ? "#FFF4" : "0004"}
                                    itemStyle={{
                                        color: darkMode ? "white" : "black"
                                    }}
                                    dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                                >
                                    <Picker.Item label='None' value={'None'} />
                                    <Picker.Item label='Professional Workshop' value={'Professional'} />
                                    <Picker.Item label='Academic Workshop' value={'Academic'} />
                                </Picker>
                            </View>
                        }
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Location Name</Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={locationName ?? ""}
                            placeholder='Where is this event?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text) => setLocationName(text)}
                            keyboardType='ascii-capable'
                            autoFocus
                            enterKeyHint='enter'
                        />
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Associated Committee</Text>
                        <Picker
                            selectedValue={committee ?? undefined}
                            onValueChange={(selectedCommittee: string) => {
                                setCommittee(selectedCommittee);
                            }}
                            style={{ color: darkMode ? "white" : "black" }}
                            selectionColor={darkMode ? "#FFF4" : "0004"}
                            itemStyle={{
                                color: darkMode ? "white" : "black"
                            }}
                            dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                        >
                            <Picker.Item label='None' value={undefined} />
                            {selectableCommittees.map((item, index) => (
                                <Picker.Item key={`item.name ${index}`} label={item.name} value={item.firebaseDocName} />
                            ))}
                        </Picker>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default UpdateEvent;
