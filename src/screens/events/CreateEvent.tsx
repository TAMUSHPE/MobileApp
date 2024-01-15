import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native'
import React, { useContext, useState } from 'react'
import { CommitteeMeeting, CustomEvent, EventType, GeneralMeeting, IntramuralEvent, SHPEEvent, SocialEvent, StudyHours, VolunteerEvent, Workshop } from '../../types/Events'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/Navigation';
import { Octicons } from '@expo/vector-icons';
import CommitteeMeetingIcon from '../../../assets/committee_meeting.svg';
import GeneralMeetingIcon from '../../../assets/general_meeting.svg';
import IntramuralIcon from '../../../assets/intramural.svg';
import SocialIcon from '../../../assets/social.svg';
import StudyHoursIcon from '../../../assets/study_hour.svg';
import WorkshopIcon from '../../../assets/workshop_event.svg';
import VolunteerIcon from '../../../assets/volunteer.svg';
import CustomIcon from '../../../assets/custom_event.svg';
import InteractButton from '../../components/InteractButton';
import { UserContext } from '../../context/UserContext';
import { StatusBar } from 'expo-status-bar';

const CreateEvent = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [selectedEventType, setSelectedEventType] = useState<EventType | undefined>();
    const { userInfo } = useContext(UserContext)!;

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const EventTypeButton = ({ eventType, label, Image }: {
        eventType: EventType,
        label: string,
        Image?: React.FC<React.SVGProps<SVGSVGElement>>
    }) => {
        return (
            <View className='w-1/2 mt-4'>
                <TouchableOpacity
                    className={`w-[97%] flex-row border border-gray-500 px-3 py-4 items-center rounded-lg `}
                    onPress={() => setSelectedEventType(eventType)}
                >
                    <View className={`h-7 w-7 border-2 rounded-full items-center justify-center ${eventType == selectedEventType ? "border-pale-blue" : "border-gray-400"}`}>
                        <View className={`h-5 w-5 rounded-full ${eventType == selectedEventType && "bg-pale-blue"}`} />
                    </View>
                    <View className='bg-gray-300 h-8 w-8 ml-2 rounded-md items-center justify-center'>
                        {Image && <Image width={25} height={25} />}
                    </View>

                    <Text className={`flex-1 ml-2 text-md ${eventType == selectedEventType ? "font-bold text-pale-blue" : "text-black"}`}>{label}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className={`flex-row items-center h-10`}>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>Create Event</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            {/* Form */}
            <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`} >
                <View className='px-6 mt-4'>
                    <Text className={`text-xl font-semibold${darkMode ? "text-white" : "text-black"}`}>Choose the event type that you want to create</Text>
                </View>

                <View className='mx-5 mt-4'>
                    <View className='flex-row flex-wrap'>
                        <EventTypeButton eventType={EventType.GENERAL_MEETING} label='General Meeting' Image={GeneralMeetingIcon} />
                        <EventTypeButton eventType={EventType.COMMITTEE_MEETING} label='Committee Meeting' Image={CommitteeMeetingIcon} />
                        <EventTypeButton eventType={EventType.STUDY_HOURS} label='Study Hours' Image={StudyHoursIcon} />
                        <EventTypeButton eventType={EventType.WORKSHOP} label='Workshop' Image={WorkshopIcon} />
                        <EventTypeButton eventType={EventType.VOLUNTEER_EVENT} label='Volunteer' Image={VolunteerIcon} />
                        <EventTypeButton eventType={EventType.SOCIAL_EVENT} label='Social' Image={SocialIcon} />
                        <EventTypeButton eventType={EventType.INTRAMURAL_EVENT} label='Intramural' Image={IntramuralIcon} />
                        <EventTypeButton eventType={EventType.CUSTOM_EVENT} label='Custom' Image={CustomIcon} />
                    </View>

                    {selectedEventType && (
                        <InteractButton
                            buttonClassName='bg-pale-blue mt-10 mb-4 py-1 rounded-xl w-1/2 mx-auto'
                            textClassName='text-center text-white text-lg'
                            label='Next'
                            onPress={() => {
                                let newEvent: SHPEEvent | undefined = undefined;

                                switch (selectedEventType) {
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
                                    navigation.navigate("SetGeneralEventDetails", { event: newEvent });
                                }
                            }}
                        />
                    )}

                </View>
            </View>
        </SafeAreaView>
    )
}

export default CreateEvent;
