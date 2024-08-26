import { View, Text, TouchableOpacity, TextInput, Image, Platform, TouchableHighlight, Modal, Alert, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useContext, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../../types/navigation'
import { useNavigationState, useRoute } from '@react-navigation/core';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { CommitteeMeeting, EventType, GeneralMeeting, IntramuralEvent, CustomEvent, SHPEEvent, SocialEvent, StudyHours, VolunteerEvent, Workshop } from '../../types/events';
import { destroyEvent, setEvent, uploadFile } from '../../api/firebaseUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from "expo-image-picker";
import { Images } from '../../../assets';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';
import { MillisecondTimes, formatDate, formatTime } from '../../helpers/timeUtils';
import { StatusBar } from 'expo-status-bar';
import { Committee } from '../../types/committees';
import LocationPicker from '../../components/LocationPicker';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import InteractButton from '../../components/InteractButton';
import { getBlobFromURI, selectImage } from '../../api/fileSelection';
import { CommonMimeTypes, validateFileBlob } from '../../helpers';
import { auth } from '../../config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import DismissibleModal from '../../components/DismissibleModal';

const UpdateEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const routes = useNavigationState(state => state.routes);
    const isInHomeStack = routes.some(route => route.name === 'Home');


    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const insets = useSafeAreaInsets();

    // UI Hooks
    const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
    const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
    const [localImageURI, setLocalImageURI] = useState<string>();
    const [isUploading, setIsUploading] = useState<boolean>();
    const [loading, setLoading] = useState<boolean>(false);
    const [showDeletionConfirmation, setShowDeletionConfirmation] = useState<boolean>(false);


    // Form Data Hooks
    const [name, setName] = useState<string>(event.name ?? "");
    const [startTime, setStartTime] = useState<Timestamp | undefined>(event.startTime ?? undefined);
    const [endTime, setEndTime] = useState<Timestamp | undefined>(event.endTime ?? undefined);
    const [description, setDescription] = useState<string>(event.description ?? "");
    const [coverImageURI, setCoverImageURI] = useState<string>(event.coverImageURI ?? "");
    const [locationName, setLocationName] = useState<string | undefined>(event.locationName ?? undefined);
    const [geolocation, setGeolocation] = useState<GeoPoint | undefined>(event.geolocation ?? undefined);
    const [geofencingRadius, setGeofencingRadius] = useState<number | undefined>(event.geofencingRadius ?? undefined);


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

    const handleUpdateEvent = async () => {
        if (!name) {
            Alert.alert("Empty Name", "Event must have a name!")
            return;
        } else if (startTime!.toMillis() > endTime!.toMillis()) {
            Alert.alert("Event ends before start time", "Event cannot end before it starts.")
            return;
        }

        setLoading(true)
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
                console.warn(`Event type ${event.eventType} not handled. This may cause issues if given event object does not follow SHPEEvent schema.`);
                break;
        }

        if (updatedEvent.copyFromObject) {
            updatedEvent.copyFromObject(event);
        } else {
            updatedEvent = { ...event };
        }

        console.log(geofencingRadius, 'this is geofencingRadius variable');

        // Create an object without the geofencingRadius field
        const eventData: any = {
            name,
            description,
            startTime,
            endTime,
            coverImageURI,
            locationName,
            geolocation,
            geofencingRadius
        };

        if (geofencingRadius === undefined) {
            eventData.geofencingRadius = null;
        }
        if (updatedEvent.copyFromObject) {
            updatedEvent.copyFromObject(eventData);
        }

        await setEvent(event.id!, updatedEvent);
        setLoading(false)
        navigation.navigate("EventInfo", { event: updatedEvent });
    };

    const handleDestroyEvent = async () => {
        console.log("Destroying event with ID:", event.id);
        const isDeleted = await destroyEvent(event.id!);
        if (isDeleted) {
            if (isInHomeStack) {
                navigation.navigate("Home")
            } else {
                navigation.navigate("EventsScreen", {})
            }
        } else {
            console.log("Failed to delete the event.");
        }
    }


    return (
        <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <View className='absolute w-full bottom-0 mb-5 z-50'>
                <InteractButton
                    buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                    textClassName='text-center text-white text-2xl font-bold'
                    label='Update'
                    onPress={() => handleUpdateEvent()}
                />
            </View>
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <StatusBar style={darkMode ? "light" : "dark"} />
                {/* Header */}
                <View
                    style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: 16 / 9,
                    }}
                >
                    <Image
                        className="flex w-full h-full absolute"
                        defaultSource={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                        source={coverImageURI ? { uri: coverImageURI } : darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                        style={{
                            width: "100%",
                            height: "auto",
                            aspectRatio: 16 / 9,
                        }}
                    />

                    <LinearGradient
                        colors={
                            darkMode
                                ? ['rgba(0,0,0,.8)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']
                                : ['rgba(255,255,255,.8)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']
                        }
                        className='absolute w-full'
                        style={{ height: insets.top + 30 }}
                    ></LinearGradient>

                    <SafeAreaView edges={['top']}>
                        <View className='flex-row justify-between mx-4 h-full'>
                            <View className='flex-1 w-full h-full absolute justify-center items-center '>
                                {isUploading ? (
                                    <ActivityIndicator />
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => selectCoverImage()}
                                        className="rounded-3xl w-24 h-24 justify-center items-center"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    >
                                        <FontAwesome name="camera" size={40} color="white" />
                                        <Text className='mt-1 text-center text-white text-lg font-semibold'>UPLOAD</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() => { navigation.goBack() }}
                                className="rounded-full w-10 h-10 justify-center items-center"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                            >
                                <Octicons name="chevron-left" size={30} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { setShowDeletionConfirmation(true) }}
                                className="absolute top-0 right-0 rounded-full w-10 h-10 justify-center items-center"
                                style={{ backgroundColor: 'rgba(0,0,0,.8)' }}
                            >
                                <Octicons name="trash" size={24} color="#FF0000" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                {loading && (<ActivityIndicator className="mt-16" size="small" />)}
                {!loading && (
                    <View>

                        {/* General Details */}
                        <View className='px-4 mt-8'>
                            <Text className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-black"}`}>General Details</Text>
                        </View>

                        {/* Event Name */}
                        <View className='mx-4'>
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

                        {/* Location Details */}
                        <View className='px-4 mt-10'>
                            <Text className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-black"}`}>Location Details</Text>
                        </View>

                        {/* Location Name */}
                        <View className='mx-4 pb-6'>
                            <Text className={`mb-1 text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                                Location Name<Text className='text-[#f00]'>*</Text>
                            </Text>

                            <TextInput
                                className={`text-lg p-2 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
                                value={locationName}
                                placeholder='Ex. Zach 420'
                                placeholderTextColor={darkMode ? "#DDD" : "#777"}
                                onChangeText={(text) => setLocationName(text)}
                                keyboardType='ascii-capable'
                                enterKeyHint='enter'
                            />
                        </View>

                        <TouchableOpacity
                            className='border mx-4 px-4 py-2 items-center justify-center rounded-lg '
                            onPress={() => setShowLocationPicker(true)}
                        >
                            <Text className='text-black text-lg font-semibold'>Open Location Editor</Text>
                        </TouchableOpacity>

                        <View className='mb-24' />
                    </View>
                )}
            </KeyboardAwareScrollView>

            {/* Start Date Pickers */}
            {Platform.OS == 'android' && showStartDatePicker &&
                <DateTimePicker
                    testID='Start Date Picker'
                    value={startTime?.toDate() ?? new Date()}
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

            <Modal visible={showLocationPicker}>
                <View className='flex-1'>
                    <View className='z-50 w-full absolute bottom-0 mb-12'>
                        <InteractButton
                            buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                            textClassName='text-center text-white text-2xl font-bold'
                            label='Done'
                            onPress={() => { setShowLocationPicker(false) }}
                        />
                    </View>
                    <LocationPicker
                        onLocationChange={(location, radius) => {
                            if (location?.geometry.location.lat && location?.geometry.location.lng) {
                                setGeolocation(new GeoPoint(location?.geometry.location.lat, location?.geometry.location.lng));
                            }
                            setGeofencingRadius(radius);
                        }}
                        initialCoordinate={geolocation ? { latitude: geolocation.latitude, longitude: geolocation.longitude } : undefined}
                        initialRadius={geofencingRadius ?? undefined}
                        containerClassName="pt-16"
                    />
                </View>
            </Modal>

            <DismissibleModal
                visible={showDeletionConfirmation}
                setVisible={setShowDeletionConfirmation}
            >
                <View className={`flex opacity-100 rounded-md p-6 space-y-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                    <Octicons name="trash" size={24} color={darkMode ? "white" : "black"} />
                    <View className='flex items-center w-[90%]'>
                        <Text className="text-center text-md font-bold text-red-1">This is *not* reversable!</Text>
                        <Text className={`text-center text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Are you sure you want to destroy this event?</Text>
                        <View className="flex-row mt-8">
                            <TouchableOpacity
                                onPress={async () => {
                                    setShowDeletionConfirmation(false);
                                    setLoading(true);
                                    handleDestroyEvent().then(() => setLoading(false));
                                }}
                                className="w-[45%] bg-red-1 rounded-xl items-center justify-center h-12 mr-2"
                            >
                                <Text className='text-xl font-bold text-white'>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowDeletionConfirmation(false)}
                                className={`w-[45%] rounded-xl justify-center items-center ml-2 border ${darkMode ? "border-white" : "border-black"}`}
                            >
                                <Text className={`text-xl font-bold px-3 ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    )
}

const createCommitteeList = (committees: Committee[]) => {
    return committees.map(committee => ({
        committee: committee.name,
        iso: committee.firebaseDocName
    }));
};



export default UpdateEvent;
