import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, TouchableHighlight, KeyboardAvoidingView, Modal, ActivityIndicator, Alert, Switch } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../../types/navigation'
import { useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommitteeMeeting, EventType, GeneralMeeting, IntramuralEvent, CustomEvent, SHPEEvent, SocialEvent, StudyHours, VolunteerEvent, Workshop, WorkshopType } from '../../types/events';
import { destroyEvent, getCommittees, setEvent } from '../../api/firebaseUtils';
import { Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images } from '../../../assets';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';
import { MillisecondTimes, formatDate, formatTime } from '../../helpers/timeUtils';
import { StatusBar } from 'expo-status-bar';
import DismissibleModal from '../../components/DismissibleModal';
import * as ImagePicker from "expo-image-picker";
import { Committee } from '../../types/committees';
import CustomDropDownMenu, { CustomDropDownMethods } from '../../components/CustomDropDown';
import LocationPicker from '../../components/LocationPicker';
import { getBlobFromURI, selectImage, uploadFile } from '../../api/fileSelection';
import { CommonMimeTypes, validateFileBlob } from '../../helpers';
import { auth } from '../../config/firebaseConfig';

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
    const dropDownRefCommittee = useRef<CustomDropDownMethods>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
    const [localEventName, setLocalEventName] = useState<string | undefined | null>(event.name);
    const [localCoverImageURI, setLocalCoverImageURI] = useState<string>(event.coverImageURI ?? '');
    const [isFocused, setIsFocused] = useState<boolean>(true);


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
    const [geolocation, setGeolocation] = useState<GeoPoint | undefined | null>(event.geolocation);
    const [geofencingRadius, setGeofencingRadius] = useState<number | undefined | null>(event.geofencingRadius);
    const [workshopType, setWorkshopType] = useState<WorkshopType | undefined>(event.workshopType);
    const [committee, setCommittee] = useState<string | undefined | null>(event.committee);
    const [nationalConventionEligible, setNationalConventionEligible] = useState<boolean | undefined | null>(event.nationalConventionEligible);
    const [general, setIsGeneral] = useState<boolean | undefined | null>(event.general);

    useEffect(() => {
        getCommittees()
            .then((result) => setSelectableCommittees(result))
            .catch(err => console.error("Issue getting committees:", err));
    }, []);

    useEffect(() => {
        if (openDropdown === null) {
            setIsFocused(true);
        } else {
            setIsFocused(false);
        }
    }, [openDropdown])

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
                geofencingRadius,
                general,
                workshopType,
                committee,
                nationalConventionEligible,
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

        setLocalEventName(name);
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
        const result = await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        })

        if (result) {
            const imageBlob = await getBlobFromURI(result.assets![0].uri);
            if (imageBlob && validateFileBlob(imageBlob, CommonMimeTypes.IMAGE_FILES, true)) {
                setLocalCoverImageURI(result.assets![0].uri);
                if (!imageBlob) return;
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
        setChangesMade(true);
    }


    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
    };


    return (
        <View className='flex-1'>
            <StatusBar style="light" />
            {changesMade && (
                <View className='absolute right-0 bottom-0 z-50 m-5'>
                    <TouchableOpacity
                        className='bg-pale-blue px-6 py-3 rounded-md'
                        onPress={() => handleUpdateEvent()}
                    >
                        <Text className='text-white text-lg'>Update</Text>
                    </TouchableOpacity>
                </View>
            )}
            <ScrollView
                scrollEnabled={isFocused}
                className={`flex flex-col flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-white"}`}
                contentContainerStyle={{
                    paddingBottom: "50%"
                }}
            >
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
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={localCoverImageURI ? { uri: localCoverImageURI } : Images.EVENT}
                        style={{
                            width: "100%",
                            height: "auto",
                            aspectRatio: 16 / 9,
                        }}
                    />

                    <View className='absolute w-full h-full bg-[#00000055]' />

                    <View className='absolute bottom-0 px-5 py-3'>
                        <Text className="text-3xl font-bold text-white">{localEventName}{changesMade && ' *'}</Text>
                        <Text className='text-lg text-white font-bold'>Edit Event</Text>
                    </View>

                    <SafeAreaView edges={['top']}>
                        <View className='flex-row  mx-5 mt-1'>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("EventsScreen")}
                                className="rounded-full w-10 h-10 justify-center items-center"
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                            >
                                <Octicons name="chevron-left" size={30} color="white" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    <View className='absolute right-0 mx-5'>
                        <SafeAreaView edges={['top']}>
                            <TouchableOpacity
                                className='w-20 h-10 justify-center items-center rounded-md'
                                style={{ backgroundColor: 'rgba(255,0,0,0.7)' }}
                                onPress={() => setShowDeletionConfirmation(true)}
                            >
                                <Text className='text-white font-semibold text-lg'>Destroy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='w-20 h-10  justify-center items-center rounded-md mt-2'
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                                onPress={() => navigation.navigate("QRCode", { event: event })}
                            >
                                <Text className='text-white font-semibold text-lg'>QRCode</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    </View>
                </View>

                {/* Form */}
                <View className='px-4 my-8'>
                    {/* Event Name */}
                    <Text className='text-2xl font-bold'>General Details</Text>
                    <View className='-z-20'>
                        <TouchableOpacity
                            className='bg-pale-blue w-[60%] mt-4 mb-2   px-4 py-2 items-center justify-center rounded-lg '
                            onPress={() => selectCoverImage()}
                        >
                            <Text className='text-white text-lg font-semibold'>Choose Cover Image</Text>
                        </TouchableOpacity>
                    </View>
                    <KeyboardAvoidingView behavior='position' className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Event Name <Text className='text-[#f00]'>*</Text></Text>
                        <TextInput
                            className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={name ?? ""}
                            placeholder='What is this event called?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text) => {
                                setName(text)
                                setChangesMade(true);
                            }}
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
                                            setChangesMade(true);
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
                                            if (!date) {
                                                console.warn("Date picked is undefined.")
                                            }
                                            else if (endTime && date.valueOf() > endTime?.toDate().valueOf()) {
                                                Alert.alert("Invalid Start Time", "Event cannot stard after end time.")
                                            }
                                            else {
                                                setStartTime(Timestamp.fromDate(date));
                                                setChangesMade(true);
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
                                                setChangesMade(true);
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
                                            setChangesMade(true);
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
                                thumbColor={general ? "#72A9BE" : "#f4f3f4"}
                                ios_backgroundColor="#999796"
                                onValueChange={() => {
                                    setIsGeneral(previousState => !previousState)
                                    setChangesMade(true);
                                }}
                                value={general || false}
                            />
                        </View>
                    </KeyboardAvoidingView>

                    {/* Description */}
                    <KeyboardAvoidingView behavior='position' className='py-3'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Description</Text>
                        <TextInput
                            className={`h-32 text-lg p-2 rounded-md ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={description || ""}
                            placeholder='What is this event about?'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text: string) => {
                                if (text.length <= 250) {
                                    setDescription(text)
                                    setChangesMade(true);
                                }
                            }}
                            numberOfLines={2}
                            keyboardType='ascii-capable'
                            autoCapitalize='sentences'
                            multiline
                            style={{ textAlignVertical: 'top' }}
                            enterKeyHint='enter'
                        />
                    </KeyboardAvoidingView>

                    <Text className='text-2xl font-bold mt-8 mb-4'>Specific Details</Text>

                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Associated Committee</Text>
                    <View className='flex-row flex-wrap mb-6 z-30'>
                        <CustomDropDownMenu
                            data={createCommitteeList(selectableCommittees)}
                            onSelect={(item) => {
                                setCommittee(item.iso);
                                setChangesMade(true);
                            }}
                            searchKey="committee"
                            label="Select Committee"
                            isOpen={openDropdown === 'committee'}
                            onToggle={() => toggleDropdown('committee')}
                            displayType='value'
                            ref={dropDownRefCommittee}
                            disableSearch
                            selectedItemProp={event.committee ? { value: event.committee, iso: event.committee } : null}
                        />
                    </View>
                    <View className='flex-row flex-wrap mb-4'>
                        {event.signInPoints !== undefined &&
                            <View className='w-[48%] mr-[2%] z-30'>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing In <Text className='text-[#f00]'>*</Text></Text>
                                <CustomDropDownMenu
                                    data={POINTS}
                                    onSelect={(item) => {
                                        setSignInPoints(Number(item.iso))
                                        setChangesMade(true);
                                    }}
                                    searchKey="point"
                                    label="Select Points"
                                    isOpen={openDropdown === 'pointSignIn'}
                                    onToggle={() => toggleDropdown('pointSignIn')}
                                    displayType='iso'
                                    disableSearch
                                    selectedItemProp={event.signInPoints ? { value: String(event.signInPoints), iso: String(event.signInPoints) } : null}
                                />
                            </View>
                        }
                        {event.signOutPoints !== undefined &&
                            <View className='w-[48%] mr-[2%] z-20'>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing Out <Text className='text-[#f00]'>*</Text></Text>
                                <CustomDropDownMenu
                                    data={POINTS}
                                    onSelect={(item) => {
                                        setSignOutPoints(Number(item.iso))
                                        setChangesMade(true);
                                    }}
                                    searchKey="point"
                                    label="Select Points"
                                    isOpen={openDropdown === 'pointSignOut'}
                                    onToggle={() => toggleDropdown('pointSignOut')}
                                    displayType='iso'
                                    disableSearch
                                    selectedItemProp={event.signOutPoints ? { value: String(event.signOutPoints), iso: String(event.signOutPoints) } : null}
                                />
                            </View>
                        }
                        {event.pointsPerHour !== undefined &&
                            <View className={`w-[48%] mr-[2%] ${(event.signOutPoints != undefined && event.signInPoints != undefined) && "mt-9"}`}>
                                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Hourly Points<Text className='text-[#f00]'>*</Text></Text>
                                <CustomDropDownMenu
                                    data={POINTS}
                                    onSelect={(item) => {
                                        setPointsPerHour(Number(item.iso))
                                        setChangesMade(true);
                                    }}
                                    searchKey="point"
                                    label="Select Points"
                                    isOpen={openDropdown === 'pointPerHour'}
                                    onToggle={() => toggleDropdown('pointPerHour')}
                                    displayType='iso'
                                    disableSearch
                                    selectedItemProp={event.pointsPerHour ? { value: String(event.pointsPerHour), iso: String(event.pointsPerHour) } : null}
                                />
                            </View>
                        }
                    </View>

                    {event.workshopType !== undefined &&
                        <View className='-z-10'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Workshop Type <Text className='text-[#f00]'>*</Text></Text>
                            <CustomDropDownMenu
                                data={[
                                    { workshopType: "Academic", iso: "Academic" },
                                    { workshopType: "Professional", iso: "Professional" }
                                ]}
                                onSelect={(item) => {
                                    setWorkshopType(item.iso as WorkshopType);
                                    switch (item.iso) {
                                        case "Academic":
                                            setSignInPoints(2);
                                        case "Professional":
                                            setSignInPoints(3);
                                    }
                                    setChangesMade(true);
                                }}
                                searchKey="workshopType"
                                label="Select Workshop Type"
                                isOpen={openDropdown === 'workshopType'}
                                onToggle={() => toggleDropdown('workshopType')}
                                displayType='value'
                                disableSearch
                                selectedItemProp={event.workshopType ? { value: event.workshopType, iso: event.workshopType } : null}
                            />
                        </View>
                    }

                    <TouchableOpacity
                        className='flex-row mt-9 items-center -z-20'
                        onPress={() => {
                            setNationalConventionEligible(!nationalConventionEligible)
                            setChangesMade(true);
                        }}
                    >
                        <View className='h-8 w-8 border-2 border-pale-blue rounded-md items-center justify-center'>
                            {nationalConventionEligible && (
                                <Octicons name="check" size={26} color="#72A9BE" />
                            )}
                        </View>
                        <Text className='ml-2 text-lg'>Eligible for National Convention</Text>
                    </TouchableOpacity>

                    <View className='-z-20'>
                        <Text className='text-2xl font-bold mt-4 mb-4'>Location Details</Text>
                    </View>

                    {/* Location Name */}
                    <View className='-z-20'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Location Name</Text>
                        <TextInput
                            className={`text-lg p-2 rounded mb-4 ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                            value={locationName || ""}
                            placeholder='Ex. Zach 420'
                            placeholderTextColor={darkMode ? "#DDD" : "#777"}
                            onChangeText={(text) => {
                                setLocationName(text)
                                setChangesMade(true);
                            }}
                            keyboardType='ascii-capable'
                            enterKeyHint='enter'
                        />
                    </View>

                    <View className='-z-20'>
                        <TouchableOpacity
                            className='bg-pale-blue w-[60%] mt-1 mb-8 px-4 py-2 items-center justify-center rounded-lg '
                            onPress={() => setShowLocationPicker(true)}
                        >
                            <Text className='text-white text-lg font-semibold'>Open Geolocation Editor</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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

            <Modal visible={showLocationPicker}>
                <SafeAreaView edges={['top']} className='flex-1 mt-12'>
                    <TouchableOpacity
                        className='absolute right-0 bottom-0 z-50 mr-3 mb-20 bg-pale-blue  px-4 py-2 rounded-lg'
                        onPress={() => { setShowLocationPicker(false) }}
                    >
                        <Text className='text-white text-2xl font-semibold'>Done</Text>
                    </TouchableOpacity>
                    <Text className='text-2xl font-semibold ml-5 mb-5 text-center'>Update Event Location </Text>
                    <LocationPicker
                        onLocationChange={(location, radius) => {
                            if (location?.geometry.location.lat && location?.geometry.location.lng) {
                                setGeolocation(new GeoPoint(location?.geometry.location.lat, location?.geometry.location.lng));
                            }
                            setGeofencingRadius(radius);
                            setChangesMade(true);
                        }}
                        initialCoordinate={geolocation ? { latitude: geolocation.latitude, longitude: geolocation.longitude } : undefined}
                    />
                </SafeAreaView>
            </Modal>

            {/* Start Date Pickers */}
            {Platform.OS == 'android' && showStartDatePicker &&
                <DateTimePicker
                    testID='Start Date Picker'
                    value={startTime?.toDate() ?? new Date()}
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
        </View>
    )
}

const createCommitteeList = (committees: Committee[]) => {
    return committees.map(committee => ({
        committee: committee.name,
        iso: committee.firebaseDocName
    }));
};

const POINTS = [
    { point: "0", iso: "0" },
    { point: "1", iso: "1" },
    { point: "2", iso: "2" },
    { point: "3", iso: "3" },
    { point: "4", iso: "4" },
    { point: "5", iso: "5" },
]


export default UpdateEvent;
