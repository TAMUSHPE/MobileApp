import { View, Text, TouchableOpacity, ScrollView, Image, Platform, useColorScheme } from 'react-native';
import React, { useContext } from 'react';
import { EventProps, EventsStackParams } from '../../types/navigation';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { RouteProp, useRoute } from '@react-navigation/core';
import { Images } from '../../../assets';
import { MillisecondTimes, formatEventDate, formatEventDateTime, formatEventTime } from '../../helpers/timeUtils';
import { StatusBar } from 'expo-status-bar';
import { handleLinkPress } from '../../helpers/links';
import { EventType, SHPEEvent } from '../../types/events';
import { LinearGradient } from 'expo-linear-gradient';
import { reverseFormattedFirebaseName } from '../../types/committees';
import InteractButton from '../../components/InteractButton';
import { createEvent } from '../../api/firebaseUtils';
import CalendarIconBlack from '../../../assets/calendar-days-solid_black.svg'
import CalendarIconWhite from '../../../assets/calendar-days-solid_white.svg'
import ClockIconBlack from '../../../assets/clock-solid_black.svg'
import ClockIconWhite from '../../../assets/clock-solid_white.svg'
import LocationDotIconBlack from '../../../assets/location-dot-solid_black.svg'
import LocationDotIconWhite from '../../../assets/location-dot-solid_white.svg'


const FinalizeEvent = ({ navigation }: EventProps) => {
    const route = useRoute<EventInfoScreenRouteProp>();
    const { event } = route.params;
    const { name, description, eventType, startTime, endTime, coverImageURI, locationName, geolocation, committee, nationalConventionEligible } = event || {};

    const insets = useSafeAreaInsets();

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const isSameDay = (startDate: Date, endDate: Date): boolean => {
        return startDate.getDate() === endDate.getDate() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getFullYear() === endDate.getFullYear();
    };
    const sameDay = startTime && endTime && isSameDay(startTime.toDate(), endTime.toDate());

    return (
        <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} >
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
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
                        style={{ height: insets.top + 25 }}
                    ></LinearGradient>

                    <SafeAreaView edges={['top']}>
                        <View className='flex-row justify-between mx-4 h-full'>
                            <TouchableOpacity
                                onPress={() => { navigation.goBack(); }}
                                className="rounded-full w-10 h-10 justify-center items-center z-20"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                            >
                                <Octicons name="chevron-left" size={30} color="white" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                <View className='-z-10'>
                    {/* General Details */}
                    {nationalConventionEligible && (
                        <Text className={`mt-2 text-md mx-4 ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>This event is eligible for national convention requirements*
                        </Text>
                    )}

                    {(eventType === EventType.STUDY_HOURS) && (
                        <Text className={`mt-2 text-md mx-4 ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>
                            Feel free to leave the area. Just be sure to scan in and out at the event location to fully earn your points!
                        </Text>
                    )}


                    <View className='mx-4 mt-3'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        <Text className={`text-lg ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                            {eventType}
                            {committee && (" • " + reverseFormattedFirebaseName(committee))} • {calculateMaxPossiblePoints(event)} points • {userInfo?.publicInfo?.name}
                        </Text>
                    </View>


                    {/* Date, Time and Location */}
                    <View className={`mt-6 mx-4`}>
                        <View className='flex-row items-center'>
                            <View className='mr-2'>
                                {darkMode ? <CalendarIconWhite width={25} height={25} /> : <CalendarIconBlack width={25} height={25} />}
                            </View>
                            <Text className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                                {(startTime && endTime) ?
                                    (sameDay ?
                                        formatEventDate(startTime.toDate(), endTime.toDate())
                                        : formatEventDateTime(startTime.toDate(), endTime.toDate())
                                    )
                                    : ""
                                }
                            </Text>
                        </View>


                        {sameDay && (
                            <View className='flex-row items-center mt-4'>
                                <View className='mr-2'>
                                    {darkMode ? <ClockIconWhite width={25} height={25} /> : <ClockIconBlack width={25} height={25} />}
                                </View>
                                <Text className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                                    {startTime && endTime && formatEventTime(startTime.toDate(), endTime.toDate())}
                                </Text>
                            </View>
                        )}

                        {locationName && (
                            <View className='mt-4'>
                                <View className='flex-row flex-wrap items-center'>
                                    {geolocation ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (Platform.OS === 'ios') {
                                                    handleLinkPress(`http://maps.apple.com/?daddr=${geolocation.latitude},${geolocation.longitude}`);
                                                } else if (Platform.OS === 'android') {
                                                    handleLinkPress(`https://www.google.com/maps/dir/?api=1&destination=${geolocation.latitude},${geolocation.longitude}`);
                                                }
                                            }}
                                            className='flex-row items-center'
                                        >
                                            <View className='mr-2'>
                                                {darkMode ? <LocationDotIconWhite width={25} height={25} /> : <LocationDotIconBlack width={25} height={25} />}
                                            </View>
                                            <Text className={`text-lg font-semibold text-primary-blue`}>
                                                {locationName}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                                            {locationName}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                    </View>


                    {/* Description */}
                    {(description && description.trim() != "") && (
                        <View className='mx-4 mt-10'>
                            <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Description</Text>
                            <Text className={`text-lg ${darkMode ? "text-grey-light" : "text-black"}`}>{description}</Text>
                        </View>
                    )}

                    <View className='pb-20' />
                </View>
            </ScrollView>

            <View className='w-full absolute bottom-0 mb-5'>
                <InteractButton
                    buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                    textClassName='text-center text-white text-2xl font-bold'
                    underlayColor="#468DC6"
                    label='Create'
                    onPress={async () => {
                        await createEvent(event);
                        navigation.navigate("EventsScreen", {});
                    }}
                />
            </View>
        </View>
    )
}

const calculateMaxPossiblePoints = (event: SHPEEvent): number => {
    const { signInPoints, signOutPoints, pointsPerHour, startTime, endTime } = event;
    let maxPossiblePoints = 0;

    const durationHours = (endTime!.toMillis() - startTime!.toMillis()) / MillisecondTimes.HOUR;
    const accumulatedPoints = durationHours * (pointsPerHour ?? 0);

    maxPossiblePoints = (signInPoints ?? 0) + (signOutPoints ?? 0) + accumulatedPoints;
    return maxPossiblePoints;
}

export type EventInfoScreenRouteProp = RouteProp<EventsStackParams, "EventInfo">;


export default FinalizeEvent;
