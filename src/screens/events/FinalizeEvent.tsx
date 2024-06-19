import { View, Text, TouchableOpacity, ScrollView, Image, Platform, useColorScheme } from 'react-native';
import React, { useContext } from 'react';
import { EventProps, EventsStackParams } from '../../types/navigation';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { RouteProp, useRoute } from '@react-navigation/core';
import { Images } from '../../../assets';
import { MillisecondTimes, formatEventDate, formatEventTime } from '../../helpers/timeUtils';
import { StatusBar } from 'expo-status-bar';
import { handleLinkPress } from '../../helpers/links';
import { SHPEEvent } from '../../types/events';
import { LinearGradient } from 'expo-linear-gradient';
import { reverseFormattedFirebaseName } from '../../types/committees';
import InteractButton from '../../components/InteractButton';
import { createEvent } from '../../api/firebaseUtils';

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

    return (
        <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-white"}`} >
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
                        <Text className={`text-center mt-1 text-md ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>
                            This event is eligible for national convention requirements*
                        </Text>
                    )}

                    <View className='mx-4 mt-3'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        <Text className={`text-lg ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                            {eventType}
                            {committee && (" • " + reverseFormattedFirebaseName(committee))} • {calculateMaxPossiblePoints(event)} points
                        </Text>
                        <Text className={`text-lg ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                            Hosted By {userInfo?.publicInfo?.name}
                        </Text>
                    </View>

                    {/* Date, Time and Location */}
                    <View className={`mt-6 mx-4 p-4 rounded-lg ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                    >
                        <View className='flex-row'>
                            <View className='w-[50%]'>
                                <Text className={`text-lg ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>Date</Text>
                                <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>{(startTime && endTime) ? formatEventDate(startTime.toDate(), endTime.toDate()) : ""}</Text>
                            </View>

                            <View className='flex-1'>
                                <Text className={`text-lg ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>Time</Text>
                                <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>{startTime && endTime && formatEventTime(startTime.toDate(), endTime.toDate())}</Text>
                            </View>
                        </View>

                        {locationName && (
                            <View className='mt-4'>
                                <Text className={`text-lg ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>Location</Text>
                                <View className='flex-row flew-wrap items-center'>
                                    <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                                        {locationName}
                                    </Text>
                                    {geolocation && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (Platform.OS === 'ios') {
                                                    handleLinkPress(`http://maps.apple.com/?daddr=${geolocation.latitude},${geolocation.longitude}`);
                                                } else if (Platform.OS === 'android') {
                                                    handleLinkPress(`https://www.google.com/maps/dir/?api=1&destination=${geolocation.latitude},${geolocation.longitude}`);
                                                }
                                            }}
                                        >
                                            <Text className='underline text-primary-blue font-semibold text-md ml-4'>View in Maps</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {(description && description.trim() != "") && (
                        <View className='mx-4 mt-6'>
                            <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>About Event</Text>
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
                    label='Create'
                    onPress={async () => {
                        await createEvent(event);
                        navigation.navigate("EventsScreen");
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
