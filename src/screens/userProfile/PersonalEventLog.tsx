import { View, TouchableOpacity, ActivityIndicator, Text, useColorScheme, ScrollView } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getUserEventLogs } from '../../api/firebaseUtils';
import { UserEventData } from '../../types/events';
import { UserProfileStackParams } from '../../types/navigation';
import { StatusBar } from 'expo-status-bar';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { formatDateWithYear, formatTime } from '../../helpers/timeUtils';

const PersonalEventLog = ({ navigation }: NativeStackScreenProps<UserProfileStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [events, setEvents] = useState<UserEventData[]>([]);
    const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserEventLogs = async () => {
            try {
                const data = await getUserEventLogs(auth.currentUser?.uid!);
                setEvents(data);
            } catch (error) {
                console.error('Error fetching user event logs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserEventLogs();
    }, []);

    const handleExpandEventLog = (index: number) => {
        if (expandedEventIndex === index) {
            setExpandedEventIndex(null);
        } else {
            setExpandedEventIndex(index);
        }
    }


    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className='flex-row items-center justify-between mb-3'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>My Event Log</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                <View className='mx-4'>
                    {isLoading && <ActivityIndicator size="small" className='mt-4' />}
                    {!isLoading && events.map(({ eventData, eventLog }, index) => (
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
                            }
                            } key={index}
                        >
                            <TouchableOpacity
                                onPress={() => { handleExpandEventLog(index) }}
                            >
                                <View className='flex-row items-center'>
                                    <View className='flex-1'>
                                        <View className='flex-1 flex-row items-center flex-wrap'>
                                            <Text className={`text-2xl font-semibold mr-3 ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(eventData?.name, 25) || "None"}</Text>
                                            {eventLog?.verified ?
                                                (
                                                    <Text className={`text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>+{eventLog?.points} points</Text>
                                                )
                                                :
                                                (
                                                    <Text className={`text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>Pending Points</Text>
                                                )}
                                        </View>
                                        <Text className={`w-[30%] text-lg font-semibold ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>{formatDateWithYear(eventData?.startTime?.toDate()!)}</Text>
                                    </View>
                                    <Octicons name="chevron-up" size={24} color={darkMode ? "white" : "black"} />
                                </View>
                            </TouchableOpacity>
                            {expandedEventIndex === index && (
                                <View className='mt-4'>
                                    <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>You signed in {formatDateWithYear(eventLog?.signInTime?.toDate()!)} at {formatTime(eventLog?.signInTime?.toDate()!)}</Text>

                                    {eventLog?.signOutTime && (
                                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>You signed out {formatDateWithYear(eventLog?.signOutTime?.toDate()!)} at {formatTime(eventLog?.signOutTime?.toDate()!)} </Text>
                                    )}

                                    <View className='flex-row justify-end w-full mt-4'>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('EventInfo', { event: eventData! })}
                                            className='bg-primary-blue py-2 px-4 rounded-xl justify-center items-center '
                                        >
                                            <Text className='text-lg text-white font-bold'>View Event</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>

    )
}

const formatTimestamp = (timestamp: Timestamp | null | undefined) => {
    return timestamp ? new Date(timestamp.toDate()).toLocaleString() : 'N/A';
};

export default PersonalEventLog