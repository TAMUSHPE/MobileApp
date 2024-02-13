import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { useFocusEffect, useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { auth } from "../../config/firebaseConfig";
import { getEvent, getAttendanceNumber, isUserSignedIn } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { formatEventDate, formatTime } from '../../helpers/timeUtils';
import { EventProps, SHPEEventScreenRouteProp } from '../../types/Navigation'
import { SHPEEvent } from '../../types/Events';
import { Images } from '../../../assets';
import { StatusBar } from 'expo-status-bar';
import CalendarIcon from '../../../assets/calandar_pale_blue.svg'
import ClockIcon from '../../../assets/clock-pale-blue.svg'
import MapIcon from '../../../assets/map-pale-blue.svg'
import { handleLinkPress } from '../../helpers/links';
import MemberCard from '../../components/MemberCard';
import { PublicUserInfo } from '../../types/User';

const EventInfo = ({ navigation }: EventProps) => {
    const route = useRoute<SHPEEventScreenRouteProp>();
    const { eventId } = route.params;
    const [event, setEvent] = useState<SHPEEvent>();
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [attendance, setAttendance] = useState<number | null>(0);
    const { userInfo } = useContext(UserContext)!;

    const { name, description, eventType, startTime, endTime, coverImageURI, signInPoints, signOutPoints, pointsPerHour, locationName, geolocation, workshopType, committee, creator, nationalConventionEligible } = event || {};

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    useFocusEffect(
        useCallback(() => {
            const fetchUserInLog = async () => {
                const isUserInLog = await isUserSignedIn(eventId, auth?.currentUser?.uid!);
                setUserSignedIn(isUserInLog);
            };

            const fetchEventData = async () => {
                try {
                    const eventData = await getEvent(eventId);
                    if (eventData) {
                        setEvent({ ...eventData, id: eventId });
                    }
                } catch (error) {
                    console.error("An error occurred while fetching the event: ", error);
                }
            };

            const fetchAttendance = async () => {
                try {
                    const attendanceCount = await getAttendanceNumber(eventId);
                    setAttendance(attendanceCount || 0);
                } catch (error) {
                    console.error("An error occurred while fetching the attendance: ", error);
                }
            };


            fetchUserInLog();
            fetchEventData();
            fetchAttendance();

            return () => { };
        }, [eventId])
    );


    if (!event) {
        return (
            <View className='h-screen w-screen justify-center items-center'>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <ScrollView
            className={`flex flex-col flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-white"}`}
            bounces={false}
        >
            <StatusBar style="light" />
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
                    source={coverImageURI ? { uri: coverImageURI } : Images.EVENT}
                    style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: 16 / 9,
                    }}
                />

                <View className='absolute w-full h-full bg-[#00000055]' />
                <View className='absolute bottom-0 px-5 py-3'>
                    <View className=''>
                        <Text className="text-white text-4xl font-bold">{name ?? "Name"}</Text>
                        <Text className="text-white text-lg font-bold">{eventType}{workshopType && (" • " + workshopType)}{committee && (" • " + reverseFormattedFirebaseName(committee))} • {(signInPoints || 0) + (signOutPoints || 0) + (pointsPerHour || 0)} points</Text>
                    </View>
                </View>
                <SafeAreaView edges={['top']}>
                    <View className='flex-row justify-between items-center mx-5 mt-1'>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("EventsScreen")}
                            className="rounded-full w-10 h-10 justify-center items-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                        >
                            <Octicons name="chevron-left" size={30} color="white" />
                        </TouchableOpacity>

                        {userSignedIn && (
                            <View
                                className="flex-row rounded-lg justify-center items-center px-4 py-2"
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                            >
                                <Text className='text-white text-lg font-bold'>You are signed in</Text>
                                <View className='h-6 w-6 bg-[#AEF359] rounded-full items-center justify-center ml-2'>
                                    <Octicons name="check" size={16} color="black" />
                                </View>
                            </View>
                        )}

                        <View className='flex-col relative items-center'>
                            {hasPrivileges &&
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("UpdateEvent", { event })}
                                    className="rounded-lg px-3 py-3"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                                >
                                    <Octicons name="pencil" size={24} color="white" />
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Body */}
            <View className='my-4 mx-5'>
                {hasPrivileges && (
                    <View className='w-full items-center justify-center'>
                        <Text className='text-lg italic font-semibold mb-2'>Attendance: {attendance}</Text>
                    </View>
                )}

                {nationalConventionEligible && (
                    <Text className='italic font-semibold mb-2'>This event is eligible for national convention requirements*</Text>
                )}

                {(description && description != "") && (
                    <View>
                        <Text className='text-xl mt-2 italic font-bold'>Description</Text>
                        <Text className='text-lg'>{description}</Text>
                    </View>
                )}
                <Text className={`text-xl first-letter:italic font-bold ${(description && description != "") && "mt-7"}`}>Time and Location</Text>
                <View className='flex-row mt-2'>
                    <CalendarIcon width={20} height={20} />
                    <Text className='text-lg ml-2'>{(startTime && endTime) ? formatEventDate(startTime.toDate(), endTime.toDate()) : ""}</Text>
                </View>

                <View className='flex-row mt-1'>
                    <ClockIcon width={20} height={20} />
                    <Text className='text-lg ml-2'>{startTime && formatTime(startTime.toDate())} - {endTime && formatTime(endTime.toDate())}</Text>
                </View>

                {(locationName || geolocation) && (
                    <View className='flex-row mt-1'>
                        <MapIcon width={20} height={20} />
                        <Text className='text-lg ml-2'>{locationName}</Text>
                        {geolocation && (
                            <TouchableOpacity
                                onPress={() => {
                                    console.log(geolocation.latitude, geolocation.longitude)
                                    if (Platform.OS === 'ios') {
                                        handleLinkPress(`http://maps.apple.com/?daddr=${geolocation.latitude},${geolocation.longitude}`);
                                    } else if (Platform.OS === 'android') {
                                        handleLinkPress(`https://www.google.com/maps/dir/?api=1&destination=${geolocation.latitude},${geolocation.longitude}`);
                                    }
                                }}
                            >
                                <Text className={`text-lg text-pale-blue underline ${locationName && "ml-2"}`}>View Map</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {creator && (
                    <View className='mt-4'>
                        <Text className='text-xl mt-2 italic font-bold mb-2'>Event Host</Text>
                        <MemberCard userData={creator as PublicUserInfo} />
                    </View>
                )}
            </View>

        </ScrollView>
    )
}

const reverseFormattedFirebaseName = (firebaseName: string) => {
    return firebaseName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default EventInfo