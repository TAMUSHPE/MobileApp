import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Octicons } from '@expo/vector-icons';
import { getCommitteeEvents, getUpcomingEvents } from '../api/firebaseUtils';
import { SHPEEvent } from '../types/Events';
import { Committee, getLogoComponent } from '../types/Committees';
import { Timestamp } from 'firebase/firestore';
import { Images } from '../../assets';

const Ishpe = () => {
    const { userInfo } = useContext(UserContext)!;
    const userCommittees = userInfo?.publicInfo?.committees || [];
    const [ishpeEvents, setIshpeEvents] = useState<SHPEEventWithCommittee[]>([]);
    const [generalEvents, setGeneralEvents] = useState<SHPEEvent[]>([]);
    const [currentTab, setCurrentTab] = useState<string>("ISHPE")
    const [weekStartDate, setWeekStartDate] = useState(getCurrentSunday()); // Initialize with current week
    const [loadingIshpeEvents, setLoadingIshpeEvents] = useState(true);
    const [loadingGeneralEvents, setLoadingGeneralEvents] = useState(true);

    const forwardButtonDisabled = (weekStartDate.toISOString().split('T')[0] == getCurrentSunday().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoadingIshpeEvents(true);
                setLoadingGeneralEvents(true);

                // Fetch ishpeEvents
                const ishpeResponse = await getCommitteeEvents(userCommittees) as SHPEEventWithCommittee[];
                setIshpeEvents(ishpeResponse);

                // Fetch generalEvents and filter out ishpeEvents
                const generalResponse = await getUpcomingEvents();
                const filteredGeneralEvents = generalResponse.filter(generalEvent =>
                    !ishpeResponse.some(ishpeEvent => ishpeEvent.id === generalEvent.id)
                );
                setGeneralEvents(filteredGeneralEvents);

            } catch (error) {
                console.error("Error retrieving events:", error);
            } finally {
                setLoadingIshpeEvents(false);
                setLoadingGeneralEvents(false);
            }
        };

        fetchEvents();
    }, []);


    const IshpeEventTab = () => {
        if (loadingIshpeEvents) {
            return (
                <View className="flex-row justify-center items-center pb-8">
                    <ActivityIndicator size="large" />
                </View>
            );
        }

        return (
            <View>
                {ishpeEvents?.map((event: SHPEEventWithCommittee, index) => {
                    let LogoComponent, height, width, logo, color;

                    if (event.committeeData) {
                        ({ logo, color } = event.committeeData);
                        ({ LogoComponent, height, width } = getLogoComponent(logo));
                    }

                    return (
                        <View key={index} className="flex-row space-x-2 pt-4">
                            {/* If Committee is associated with event, then show Committee Logo */}
                            {LogoComponent && (
                                <View className='flex-row'>
                                    <View className='w-2 h-full mr-2' style={{ backgroundColor: event?.committeeData?.color }} />
                                    <View className="rounded-lg h-28" style={{ backgroundColor: color, minWidth: 87 }}>
                                        <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='items-center justify-center h-full'>
                                                <LogoComponent width={height! / 1.2} height={width! / 1.2} />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Display Cover Image if no committee is associated */}
                            {!LogoComponent && (
                                <View className='flex-row'>
                                    <View className="w-2 h-full mr-2 bg-maroon" />
                                    <View className="rounded-lg h-28 bg-maroon" style={{ minWidth: 87 }}>
                                        <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='h-full items-center justify-center'>
                                                <Image
                                                    className="flex w-20 h-20 rounded-full"
                                                    resizeMode='contain'
                                                    defaultSource={Images.EVENT}
                                                    source={event?.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Event Details */}
                            <View>
                                <Text className="text-pale-blue font-semibold">{formatDate(event?.startTime!)}</Text>
                                <Text className="font-bold">{event?.name}</Text>
                                <View className="flex-row items-center">
                                    <View className='flex-row items-center'>
                                        <Text className="text-sm semibold">{event?.locationName || "TBD"}</Text>
                                        <Text className="text-lg text-pale-blue semibold"> • </Text>
                                    </View>
                                    <Text className="text-sm semibold">{formatStartTime(event?.startTime!)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const GeneralTab = () => {
        if (loadingGeneralEvents) {
            return (
                <View className="flex-row justify-center items-center pb-8">
                    <ActivityIndicator size="large" />
                </View>
            );
        }

        return (
            <View>
                {generalEvents?.map((event: SHPEEventWithCommittee, index) => {
                    let LogoComponent, height, width, logo, color;

                    if (event.committeeData) {
                        ({ logo, color } = event.committeeData);
                        ({ LogoComponent, height, width } = getLogoComponent(logo));
                    }

                    return (
                        <View key={index} className="flex-row space-x-2 pt-4">
                            {/* If Committee is associated with event, then show Committee Logo */}
                            {LogoComponent && (
                                <View className='flex-row'>
                                    <View className='w-2 h-full mr-2' style={{ backgroundColor: event?.committeeData?.color }} />
                                    <View className="rounded-lg h-28" style={{ backgroundColor: color, minWidth: 87 }}>
                                        <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='items-center justify-center h-full'>
                                                <LogoComponent width={height! / 1.2} height={width! / 1.2} />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Display Cover Image if no committee is associated */}
                            {!LogoComponent && (
                                <View className='flex-row'>
                                    <View className='w-2 h-full mr-2 bg-maroon' />
                                    <View className="rounded-lg h-28 bg-maroon" style={{ minWidth: 87 }}>
                                        <View className='rounded-lg' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='h-full items-center justify-center'>
                                                <Image
                                                    className="flex h-full w-full rounded-lg"
                                                    resizeMode='contain'
                                                    defaultSource={Images.EVENT}
                                                    source={event?.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Event Details */}
                            <View>
                                <Text className="text-pale-blue font-semibold">{formatDate(event?.startTime!)}</Text>
                                <Text className="font-bold">{event?.name}</Text>
                                <View className="flex-row items-center">
                                    <View className='flex-row items-center'>
                                        <Text className="text-sm semibold">{event?.locationName || "TBD"}</Text>
                                        <Text className="text-lg text-pale-blue semibold"> • </Text>
                                    </View>
                                    <Text className="text-sm semibold">{formatStartTime(event?.startTime!)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };


    return (
        <View className="mx-7 bg-gray-100 rounded-md flex-col mt-4">
            {/* Tabs */}
            <View className="flex-row bg-gray-200 rounded-md p-3 pb-1">
                <TouchableOpacity
                    className="flex-1 justify-center items-center"
                    onPress={() => setCurrentTab('ISHPE')}>
                    <Text className="font-bold text-center">I.SHPE</Text>
                    {currentTab === 'ISHPE' && <View className="pt-1 border-b-2 border-pale-blue w-1/2" />}
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 justify-center items-center"
                    onPress={() => setCurrentTab('General')}>
                    <Text className="font-bold text-center">General</Text>
                    {currentTab === 'General' && <View className="pt-1 border-b-2 border-pale-blue w-1/2" />}
                </TouchableOpacity>
            </View>

            {/* Date Control */}
            <View className="flex-row justify-end p-3">
                <TouchableOpacity onPress={() => setWeekStartDate(adjustWeekRange(weekStartDate, 'backwards'))}>
                    <Octicons name="chevron-left" size={25} color="black" />
                </TouchableOpacity>

                <Text className="pt-1 px-1"> {formatWeekRange(weekStartDate)} </Text>

                <TouchableOpacity
                    onPress={() => setWeekStartDate(adjustWeekRange(weekStartDate, 'forwards'))}
                    disabled={forwardButtonDisabled}
                    className={`${forwardButtonDisabled ? 'opacity-30' : 'opacity-100'}`}>
                    <Octicons name="chevron-right" size={25} color="black" />
                </TouchableOpacity>
            </View>

            {/* Tab */}
            {currentTab === 'ISHPE' && IshpeEventTab()}
            {currentTab === 'General' && GeneralTab()}

        </View>
    );
};

const getCurrentSunday = () => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    return currentDate;
}

const adjustWeekRange = (currentStartDate: Date, direction: string) => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // milliseconds in one week
    let newStartDate = new Date(currentStartDate.getTime() + (direction === 'forwards' ? oneWeek : -oneWeek));
    return newStartDate;
}

const formatWeekRange = (startDate: Date) => {
    let endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const format = (date: Date) => `${date.getMonth() + 1}/${date.getDate().toString().padStart(2, '0')}`;
    return `${format(startDate)} - ${format(endDate)}`;
}

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


type SHPEEventWithCommittee = SHPEEvent & { committeeData?: Committee };

export default Ishpe;