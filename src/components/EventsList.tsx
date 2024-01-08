import { View, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { Timestamp } from 'firebase/firestore';
import { Committee, getLogoComponent } from '../types/Committees';
import { SHPEEvent } from '../types/Events';
import { Images } from '../../assets';

const EventsList = ({ events, navigation, isLoading, showImage = true }: {
    events: SHPEEventWithCommitteeData[],
    navigation?: any
    , isLoading?: boolean,
    showImage?: boolean
}) => {
    if (isLoading) {
        return (
            <View className="flex-row justify-center items-center pb-8">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View>
            {events?.map((event: SHPEEventWithCommitteeData, index) => {
                let LogoComponent, height, width, logo, color;

                if (event.committeeData) {
                    ({ logo, color } = event.committeeData);
                    ({ LogoComponent, height, width } = getLogoComponent(logo));
                }

                return (
                    <TouchableOpacity
                        key={index}
                        className="flex-row space-x-2 pt-4"
                        onPress={() => navigation.navigate("EventInfo", { eventId: event.id })}
                    >
                        {/* If Committee is associated with event, then show Committee Logo */}
                        {LogoComponent && (
                            <View className='flex-row'>
                                <View className='w-2 h-full mr-2' style={{ backgroundColor: event?.committeeData?.color }} />
                                {showImage && (
                                    <View className="rounded-lg h-28" style={{ backgroundColor: color, minWidth: 87 }}>
                                        <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='items-center justify-center h-full'>
                                                <LogoComponent width={height! / 1.2} height={width! / 1.2} />
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Display Cover Image if no committee is associated */}
                        {!LogoComponent && (
                            <View className='flex-row'>
                                <View className='w-2 h-full mr-2 bg-maroon' />
                                {showImage && (
                                    <View className="rounded-lg h-28 bg-maroon" style={{ minWidth: 87 }}>
                                        <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='h-full items-center justify-center'>
                                                <Image
                                                    className="flex h-full w-full rounded-lg"
                                                    resizeMode='cover'
                                                    defaultSource={Images.EVENT}
                                                    source={event?.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Event Details */}
                        <View>
                            <Text className="text-pale-blue font-semibold text-lg">{formatDate(event?.startTime!)}</Text>
                            <Text className="font-bold text-lg">{event?.name}</Text>
                            <View className="flex-row items-center">
                                <View className='flex-row items-center'>
                                    <Text className="semibold text-md">{event?.locationName || "TBD"}</Text>
                                    <Text className="text-2xl text-pale-blue semibold"> • </Text>
                                </View>
                                <Text className="semibold text-md">{formatStartTime(event?.startTime!)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};


const formatDate = (firestoreTimestamp: Timestamp) => {
    const date = new Date(firestoreTimestamp.seconds * 1000 + firestoreTimestamp.nanoseconds / 1000000);

    const dateNum = date.getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const day = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];

    return `${dateNum.toString().padStart(2, '0')} ${month}, ${day}`; // Format: 04 Dec, Mon
}


const formatStartTime = (firestoreTimestamp: Timestamp) => {
    const date = new Date(firestoreTimestamp.seconds * 1000);

    const hours = date.getHours();
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = date.getMinutes().toString().padStart(2, "0");
    const amPm = hours >= 12 ? 'PM' : 'AM';

    return `${formattedHours}:${formattedMinutes} ${amPm}`;
}


type SHPEEventWithCommitteeData = SHPEEvent & { committeeData?: Committee };


export default EventsList