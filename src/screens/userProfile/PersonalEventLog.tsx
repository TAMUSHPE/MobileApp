import { View, TouchableOpacity, ActivityIndicator, Text, useColorScheme, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Image } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getInstagramPointsLog, getUserEventLogs } from '../../api/firebaseUtils';
import { SHPEEvent, SHPEEventLog, UserEventData } from '../../types/events';
import { UserProfileStackParams } from '../../types/navigation';
import { StatusBar } from 'expo-status-bar';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { formatDateWithYear, formatTime } from '../../helpers/timeUtils';
import { Images } from '../../../assets';

const PersonalEventLog = ({ navigation }: NativeStackScreenProps<UserProfileStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [events, setEvents] = useState<UserEventData[]>([]);
    const [instagramLog, setInstagramLog] = useState<SHPEEventLog | null>();
    const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
    const [instagramExpand, setInstagramExpand] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [endOfData, setEndOfData] = useState(false);
    const lastVisibleRef = useRef<DocumentSnapshot | null>(null);

    const loadMoreEventLogs = async () => {
        if (isLoading || endOfData) return;
        setIsLoading(true);
        const { events: newEvents, lastVisibleDoc } = await getUserEventLogs(auth.currentUser?.uid!, 15, lastVisibleRef.current, setEndOfData);
        setEvents([...events, ...newEvents]);
        lastVisibleRef.current = lastVisibleDoc;
        setIsLoading(false);
    };

    const fetchInitialEventLogs = async () => {
        setEvents([]);
        setIsLoading(true);
        const { events: initialEvents, lastVisibleDoc } = await getUserEventLogs(auth.currentUser?.uid!, 15, null, setEndOfData);
        setEvents(initialEvents);
        lastVisibleRef.current = lastVisibleDoc;
        setIsLoading(false);
    };

    const fetchInstagramPointsLog = async () => {
        const log = await getInstagramPointsLog(auth.currentUser?.uid!);
        setInstagramLog(log)

    }

    useEffect(() => {
        fetchInitialEventLogs();
        fetchInstagramPointsLog();
    }, [auth.currentUser?.uid]);

    const handleExpandEventLog = (index: number) => {
        if (expandedEventIndex === index) {
            setExpandedEventIndex(null);
        } else {
            setExpandedEventIndex(index);
        }
    }

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent) || endOfData) return;
        loadMoreEventLogs();
    }, [isLoading, endOfData]);


    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={400}
            >
                <View className='flex-row items-center justify-between mb-3'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>My Event Log</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                {(instagramLog != null) && (
                    <View
                        className={`mx-4 mt-8 rounded-md p-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                        <TouchableOpacity onPress={() => setInstagramExpand(!instagramExpand)}>
                            <View className='flex-row items-center'>
                                <View className='flex-1'>
                                    <View className='flex-1 flex-row items-center flex-wrap'>
                                        <Image
                                            resizeMode='contain'
                                            className='w-10 h-10 mr-2'
                                            source={Images.INSTAGRAM}
                                        />
                                        <Text className={`text-2xl font-semibold mr-3 ${darkMode ? "text-white" : "text-black"}`}>Instagram Points</Text>
                                    </View>
                                    <Text className={`mt-2 text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                                        +{instagramLog?.points} points
                                    </Text>
                                </View>
                                <Octicons name="chevron-up" size={24} color={darkMode ? "white" : "black"} />
                            </View>
                        </TouchableOpacity>
                        {instagramExpand && (
                            <View className='mt-4'>
                                <Text className={`text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>Confirmation Dates</Text>
                                {instagramLog?.instagramLogs && instagramLog.instagramLogs.length > 0 && (
                                    instagramLog.instagramLogs.map((log, index) => (
                                        <Text key={index} className={`text-lg ${darkMode ? "text-white" : "text-black"} mb-1`}>
                                            {formatDateWithYear(log.toDate())} at {formatTime(log.toDate())}
                                        </Text>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View className='mx-4'>
                    {events.map(({ eventData, eventLog }, index) => (
                        <View
                            className={`mt-8 rounded-md p-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            key={index}
                        >
                            <TouchableOpacity onPress={() => handleExpandEventLog(index)}>
                                <View className='flex-row items-center'>
                                    <View className='flex-1'>
                                        <View className='flex-1 flex-row items-center flex-wrap'>
                                            <Text className={`text-2xl font-semibold mr-3 ${darkMode ? "text-white" : "text-black"}`}>
                                                {truncateStringWithEllipsis(eventData?.name, 25) || "None"}
                                            </Text>
                                            {eventLog?.verified ? (
                                                <Text className={`text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                                                    +{eventLog?.points} points
                                                </Text>
                                            ) : (
                                                <Text className={`text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                                                    Pending Points
                                                </Text>
                                            )}
                                        </View>
                                        <Text className={`text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                                            {formatDateWithYear(eventData?.startTime?.toDate()!)}
                                        </Text>
                                    </View>
                                    <Octicons name="chevron-up" size={24} color={darkMode ? "white" : "black"} />
                                </View>
                            </TouchableOpacity>
                            {expandedEventIndex === index && (
                                <View className='mt-4'>
                                    <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>
                                        You signed in {formatDateWithYear(eventLog?.signInTime?.toDate()!)} at {formatTime(eventLog?.signInTime?.toDate()!)}
                                    </Text>
                                    {eventLog?.signOutTime && (
                                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>
                                            You signed out {formatDateWithYear(eventLog?.signOutTime?.toDate()!)} at {formatTime(eventLog?.signOutTime?.toDate()!)}
                                        </Text>
                                    )}
                                    <View className='flex-row justify-end w-full mt-4'>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('EventInfo', { event: eventData! })}
                                            className='bg-primary-blue py-2 px-4 rounded-xl justify-center items-center'
                                        >
                                            <Text className='text-lg text-white font-bold'>View Event</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                    {isLoading && (
                        <View className='py-4'>
                            <ActivityIndicator size="small" />
                        </View>
                    )}
                    {endOfData && !isLoading && (
                        <View className='mt-8'>
                            <Text className='text-xl text-center'>No more event logs</Text>
                        </View>
                    )}
                </View>
                <View className='pb-24' />
            </ScrollView>
        </SafeAreaView>
    );
}

const formatTimestamp = (timestamp: Timestamp | null | undefined) => {
    return timestamp ? new Date(timestamp.toDate()).toLocaleString() : 'N/A';
};

export default PersonalEventLog