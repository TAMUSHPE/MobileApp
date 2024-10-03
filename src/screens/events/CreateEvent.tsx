import { View, Text, TouchableOpacity, Alert, useColorScheme } from 'react-native'
import React, { useContext, useState } from 'react'
import { CommitteeMeeting, CustomEvent, EventType, GeneralMeeting, IntramuralEvent, SHPEEvent, SocialEvent, StudyHours, VolunteerEvent, Workshop } from '../../types/events'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/navigation';
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
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [selectedEventType, setSelectedEventType] = useState<EventType | undefined>();

    const EventTypeButton = ({ eventType, label, Image }: {
        eventType: EventType,
        label: string,
        Image?: React.FC<React.SVGProps<SVGSVGElement>>
    }) => {
        return (
            <View className='w-[47%] mt-8'>
                <TouchableOpacity
                    className={`w-[100%] flex-row px-2 py-4 items-center rounded-lg border ${darkMode ? 'border-grey-light bg-secondary-bg-dark' : 'border-grey-dark bg-secondary-bg-light'}`}
                    style={{
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                    onPress={() => {
                        if (selectedEventType == eventType) {
                            setSelectedEventType(undefined);
                            return;
                        }
                        setSelectedEventType(eventType);
                    }}
                >
                    <View className={`h-7 w-7 border-2 rounded-full items-center justify-center ${eventType == selectedEventType ? "border-primary-blue" : darkMode ? "border-grey-light" : "border-grey-dark"}`}>
                        <View className={`h-5 w-5 rounded-full ${eventType == selectedEventType && "bg-primary-blue"}`} />
                    </View>
                    <View className={`h-8 w-8 ml-2 rounded-md items-center justify-center bg-grey-light`}>
                        {Image && <Image width={25} height={25} />}
                    </View>
                    <Text className={`flex-1 ml-2 text-md ${darkMode ? 'text-white' : 'text-black'}`}>{label}</Text>
                </TouchableOpacity>
            </View>
        )
    }
    return (
        <SafeAreaView edges={['top']} className={`flex flex-col h-screen ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Create Event</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            {/* Form */}
            <View className={`flex-1`} >
                <View className='px-4 mt-4'>
                    <Text className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Choose the event type</Text>
                </View>

                <View className='px-4'>
                    <View className='flex-row justify-between'>
                        <EventTypeButton eventType={EventType.GENERAL_MEETING} label='General Meeting' Image={GeneralMeetingIcon} />

                        <EventTypeButton eventType={EventType.COMMITTEE_MEETING} label='Committee Meeting' Image={CommitteeMeetingIcon} />

                    </View>

                    <View className='flex-row justify-between'>
                        <EventTypeButton eventType={EventType.STUDY_HOURS} label='Study Hours' Image={StudyHoursIcon} />
                        <EventTypeButton eventType={EventType.WORKSHOP} label='Workshop' Image={WorkshopIcon} />
                    </View>

                    <View className='flex-row justify-between'>
                        <EventTypeButton eventType={EventType.VOLUNTEER_EVENT} label='Volunteer' Image={VolunteerIcon} />
                        <EventTypeButton eventType={EventType.SOCIAL_EVENT} label='Social' Image={SocialIcon} />
                    </View>

                    <View className='flex-row justify-between'>
                        <EventTypeButton eventType={EventType.INTRAMURAL_EVENT} label='Intramural' Image={IntramuralIcon} />
                        <EventTypeButton eventType={EventType.CUSTOM_EVENT} label='Custom' Image={CustomIcon} />
                    </View>

                </View>

                <SafeAreaView edges={['bottom']} className='w-full absolute bottom-0 mb-16'>
                    {selectedEventType && (
                        <View>
                            <InteractButton
                                buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                                textClassName='text-center text-white text-2xl font-bold'
                                underlayColor="#468DC6"
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
                        </View>
                    )}
                </SafeAreaView>
            </View>
        </SafeAreaView>
    )
}

export default CreateEvent;
