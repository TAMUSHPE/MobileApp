import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { EventProps, SHPEEventScreenRouteProp } from '../../types/Navigation'
import { useFocusEffect, useRoute } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { SHPEEvent } from '../../types/Events';
import { getEvent, getAttendanceNumber, isUserSignedIn } from '../../api/firebaseUtils';
import { auth } from "../../config/firebaseConfig";
import { UserContext } from '../../context/UserContext';
import { formatDateTime, monthNames } from '../../helpers/timeUtils';
import { Images } from '../../../assets';


const EventInfo = ({ navigation }: EventProps) => {
    const route = useRoute<SHPEEventScreenRouteProp>();
    const { eventId } = route.params;
    const [event, setEvent] = useState<SHPEEvent>();
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [attendance, setAttendance] = useState<number | null>(0);
    const { userInfo } = useContext(UserContext)!;

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
    } else {
        return (
            <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                {/* Header */}
                <View className='flex-row items-center justify-center h-10'>
                    <TouchableOpacity className='px-6 flex-1' onPress={() => navigation.goBack()} >
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>{event.name}</Text>
                    {
                        hasPrivileges ?
                            <TouchableOpacity className='px-6 flex-1 flex flex-row-reverse' onPress={() => navigation.navigate("UpdateEvent", { event })} >
                                <View className={`rounded pl-4 pr-1 py-1`}>
                                    <Octicons name="pencil" size={24} color={darkMode ? "white" : "black"} />
                                </View>
                            </TouchableOpacity> :
                            <View className='flex-1' />
                    }
                </View>
                <ScrollView className={`flex flex-col flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-white"}`}>
                    <View className='flex flex-col p-4'>
                        <Image
                            source={event.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                            resizeMode='contain'
                            style={{
                                width: "100%",
                                height: undefined,
                                aspectRatio: 16 / 9,
                            }}
                        />
                        <View className='py-2'>
                            <Text className={`text-xl ${darkMode ? "text-[#229fff]" : "text-[#5233ff]"}`}><Octicons name='calendar' size={24} /> {formatDateTime(event.startTime!.toDate())}</Text>
                            <Text className={`text-4xl ${darkMode ? "text-white" : "text-black"}`}>{event.name}</Text>
                            <Text className={`text-2xl ${darkMode ? "text-[#DDD]" : "text-[#333]"}`}>{event.description}</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        )
    }
}

export default EventInfo