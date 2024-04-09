import { View, Text, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { useRoute } from '@react-navigation/core';
import { Images } from '../../../assets';
import { formatEventDate, formatTime } from '../../helpers/timeUtils';
import { createEvent, getPublicUserData } from '../../api/firebaseUtils';
import { StatusBar } from 'expo-status-bar';
import CalendarIcon from '../../../assets/calandar_pale_blue.svg'
import ClockIcon from '../../../assets/clock-pale-blue.svg'
import MapIcon from '../../../assets/map-pale-blue.svg'
import MemberCard from '../../components/MemberCard';
import { handleLinkPress } from '../../helpers/links';
import { PublicUserInfo } from '../../types/User';


const FinalizeEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;

    const { name, description, eventType, startTime, endTime, coverImageURI, signInPoints, signOutPoints, pointsPerHour, locationName, geolocation, workshopType, committee, creator, nationalConventionEligible } = event || {};

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const [creatorData, setCreatorData] = useState<PublicUserInfo | null>()

    useEffect(() => {
        const fetchCreatorInfo = async () => {
            if (creator) {
                const fetchedCreator = await getPublicUserData(creator);
                setCreatorData(fetchedCreator || null);
            }
        }

        fetchCreatorInfo();
    }, [creator])


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
                            onPress={() => navigation.goBack()}
                            className="rounded-full w-10 h-10 justify-center items-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                        >
                            <Octicons name="chevron-left" size={30} color="white" />
                        </TouchableOpacity>

                        <View className='flex-col relative items-center'>
                            <TouchableOpacity
                                className="rounded-lg px-3 py-3 bg-pale-blue"
                                onPress={async () => {
                                    await createEvent(event);
                                    navigation.navigate("EventsScreen");
                                }}
                            >
                                <Text className='text-white font-bold text-lg'>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Body */}
            <View className='my-4 mx-5'>
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

                {creatorData && (
                    <View className='mt-4'>
                        <Text className='text-xl mt-2 italic font-bold mb-2'>Event Host</Text>
                        <MemberCard userData={creatorData} />
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const reverseFormattedFirebaseName = (firebaseName: string) => {
    return firebaseName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default FinalizeEvent;
