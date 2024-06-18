import { View, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import { Timestamp } from 'firebase/firestore';
import { Committee, getLogoComponent } from '../types/committees';
import { SHPEEvent } from '../types/events';
import { Images } from '../../assets';
import { monthNames } from '../helpers/timeUtils';
import { UserContext } from '../context/UserContext';

const EventsList = ({ events, navigation, isLoading, showImage = true, onEventClick }: {
    events: SHPEEvent[],
    navigation?: any
    , isLoading?: boolean,
    showImage?: boolean
    onEventClick?: () => void
}) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    if (isLoading) {
        return (
            <View className="flex-row justify-center items-center pb-8">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View>
            {events?.map((event: SHPEEvent, index) => {
                return (
                    <TouchableOpacity
                        key={index}
                        className="flex-row space-x-2 pt-4"
                        onPress={() => {
                            navigation.navigate("EventInfo", { event: event });
                            if (onEventClick) {
                                onEventClick();
                            }
                        }}
                    >

                        <View className='flex-row'>
                            <View className='w-2 h-full mr-2 bg-maroon' />
                            {showImage && (
                                <View className="rounded-lg h-28 bg-maroon" style={{ minWidth: 87 }}>
                                    <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                        <View className='h-full items-center justify-center'>
                                            <Image
                                                className="flex h-full w-full rounded-lg"
                                                resizeMode='cover'
                                                defaultSource={Images.SHPE_NAVY}
                                                source={event?.coverImageURI ? { uri: event.coverImageURI } : Images.SHPE_NAVY}
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>


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

                        {hasPrivileges && (
                            <TouchableOpacity
                                onPress={() => { navigation.navigate("QRCode", { event: event }) }}
                                className='bg-gray-600 absolute right-0 top-0 p-2'
                            >
                                <Text className='text-white'>QRCode</Text>
                            </TouchableOpacity>
                        )}
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

export default EventsList
