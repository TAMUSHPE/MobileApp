import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/core';
import { Octicons, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getUpcomingEvents, fetchAndStoreUser, getWeekPastEvents } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { Images } from '../../../assets';
import { formatTime } from '../../helpers/timeUtils';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { EventsStackParams } from '../../types/navigation';
import { EventType, ExtendedEventType, SHPEEvent } from '../../types/events';
import EventCard from './EventCard';
import DismissibleModal from '../../components/DismissibleModal';

interface EventGroups {
    today: SHPEEvent[];
    upcoming: SHPEEvent[];
    past: SHPEEvent[];
}


const Events = ({ navigation }: EventsProps) => {
    const route = useRoute<EventsScreenRouteProp>();
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [isLoading, setIsLoading] = useState(true);
    const [mainEvents, setMainEvents] = useState<EventGroups>({ today: [], upcoming: [], past: [] });
    const [intramuralEvents, setIntramuralEvents] = useState<EventGroups>({ today: [], upcoming: [], past: [] });
    const [committeeEvents, setCommitteeEvents] = useState<EventGroups>({ today: [], upcoming: [], past: [] });
    const [infoVisible, setInfoVisible] = useState(false);
    const [filter, setFilter] = useState<"main" | "intramural" | "committee">("main");

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const selectedEvents = filter === "main" ? mainEvents : filter === "intramural" ? intramuralEvents : committeeEvents;

    const fetchEvents = async () => {
        try {
            setIsLoading(true);

            const upcomingEventsData = await getUpcomingEvents();
            const allPastEvents = await getWeekPastEvents();

            const currentTime = new Date();
            const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());

            const todayEvents = upcomingEventsData.filter(event => {
                const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                return startTime >= today && startTime < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });
            const upcomingEvents = upcomingEventsData.filter(event => {
                const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                return startTime >= new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });

            const mainEventsFiltered = upcomingEventsData.filter(
                (event: SHPEEvent) =>
                    (hasPrivileges || !event.hiddenEvent) &&
                    event.eventType !== EventType.COMMITTEE_MEETING &&
                    event.eventType !== EventType.INTRAMURAL_EVENT
            );

            const intramuralEventsFiltered = upcomingEventsData.filter(
                (event: SHPEEvent) =>
                    (hasPrivileges || !event.hiddenEvent) &&
                    event.eventType === EventType.INTRAMURAL_EVENT
            );

            const committeeEventsFiltered = upcomingEventsData.filter(
                (event: SHPEEvent) =>
                    (hasPrivileges || !event.hiddenEvent) &&
                    event.eventType === EventType.COMMITTEE_MEETING
            );

            const pastMainEvents = allPastEvents.filter(
                (event: SHPEEvent) =>
                    (hasPrivileges || !event.hiddenEvent) &&
                    event.eventType !== EventType.COMMITTEE_MEETING &&
                    event.eventType !== EventType.INTRAMURAL_EVENT
            );

            const pastIntramuralEvents = allPastEvents.filter(
                (event: SHPEEvent) =>
                    (hasPrivileges || !event.hiddenEvent) &&
                    event.eventType === EventType.INTRAMURAL_EVENT
            );

            const pastCommitteeEvents = allPastEvents.filter(
                (event: SHPEEvent) =>
                    (hasPrivileges || !event.hiddenEvent) &&
                    event.eventType === EventType.COMMITTEE_MEETING
            );



            setMainEvents({
                today: todayEvents.filter(event => mainEventsFiltered.includes(event)),
                upcoming: upcomingEvents.filter(event => mainEventsFiltered.includes(event)),
                past: pastMainEvents,
            });

            setIntramuralEvents({
                today: todayEvents.filter(event => intramuralEventsFiltered.includes(event)),
                upcoming: upcomingEvents.filter(event => intramuralEventsFiltered.includes(event)),
                past: pastIntramuralEvents,
            });

            setCommitteeEvents({
                today: todayEvents.filter(event => committeeEventsFiltered.includes(event)),
                upcoming: upcomingEvents.filter(event => committeeEventsFiltered.includes(event)),
                past: pastCommitteeEvents,
            });

            setIsLoading(false);
        } catch (error) {
            console.error('An error occurred while fetching events:', error);
            setIsLoading(false);
        }
    };


    useEffect(() => {
        const fetchUserData = async () => {
            const firebaseUser = await fetchAndStoreUser();
            if (firebaseUser) {
                setUserInfo(firebaseUser);
            }
        };

        fetchEvents();
        fetchUserData();
    }, [])


    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchEvents();
            }
        }, [hasPrivileges])
    );


    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row px-4 items-center'>
                    <Text className={`text-4xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Events</Text>
                    <TouchableOpacity className="ml-2" activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                <View
                    className={`flex-row mt-5 mx-4 rounded-3xl ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                    <TouchableOpacity
                        className={`items-center justify-center flex-1 rounded-3xl m-1 py-2 ${filter == "main" && "bg-primary-blue"}`}
                        onPress={() => {
                            setFilter("main")
                        }}
                    >
                        <Text
                            className={`text-xl font-bold ${darkMode ? "text-white" : filter === "main" ? "text-white" : "text-black"}`}
                        >
                            Main
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`items-center justify-center flex-1 rounded-3xl m-1 py-2 ${filter == "intramural" && "bg-primary-blue"}`}
                        onPress={() => {
                            setFilter("intramural")
                        }}
                    >
                        <Text
                            className={`text-xl font-bold ${darkMode ? "text-white" : filter === "intramural" ? "text-white" : "text-black"}`}
                        >
                            Intramural
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`items-center justify-center flex-1 rounded-3xl m-1 py-2 ${filter == "committee" && "bg-primary-blue"}`}
                        onPress={() => {
                            setFilter("committee")
                        }}
                    >
                        <Text
                            className={`text-xl font-bold ${darkMode ? "text-white" : filter === "committee" ? "text-white" : "text-black"}`}
                        >
                            Committee
                        </Text>
                    </TouchableOpacity>
                </View>

                {isLoading &&
                    <View className='mt-10 justify-center items-center'>
                        <ActivityIndicator size="small" />
                    </View>
                }

                {/* Event Listings */}
                {!isLoading && (
                    <View className="px-4">
                        {selectedEvents.today.length === 0 &&
                            selectedEvents.upcoming.length === 0 &&
                            selectedEvents.past.length === 0 ? (
                            <View className="mt-10 justify-center items-center">
                                <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>No Events</Text>
                            </View>
                        ) : (
                            <View>
                                {/* Today's Events */}
                                {selectedEvents.today.length !== 0 && (
                                    <View className="mt-8">
                                        <Text className={`mb-3 text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Today's Events</Text>
                                        {selectedEvents.today.map((event: SHPEEvent, index) => (
                                            <TouchableOpacity
                                                key={event.id}
                                                className={`h-32 rounded-md ${index > 0 && "mt-8"}`}
                                                style={{
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 3.84,
                                                    elevation: 5,
                                                }}
                                                onPress={() => {
                                                    navigation.navigate("EventInfo", { event: event });
                                                }}
                                            >
                                                <Image
                                                    className="flex h-full w-full rounded-2xl"
                                                    resizeMode="cover"
                                                    defaultSource={darkMode ? Images.SHPE_WHITE : Images.SHPE_NAVY}
                                                    source={
                                                        event?.coverImageURI
                                                            ? { uri: event.coverImageURI }
                                                            : darkMode
                                                                ? Images.SHPE_WHITE
                                                                : Images.SHPE_NAVY
                                                    }
                                                />
                                                <LinearGradient
                                                    colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"]}
                                                    className="absolute bottom-0 h-[70%] w-full rounded-b-lg justify-center"
                                                >
                                                    <View className="px-4 pt-6">
                                                        <Text className="text-xl font-bold text-white">
                                                            {truncateStringWithEllipsis(event.name, 20)}
                                                        </Text>
                                                        {event.locationName ? (
                                                            <Text className="text-md font-semibold text-white">
                                                                {truncateStringWithEllipsis(event.locationName, 24)}
                                                            </Text>
                                                        ) : null}
                                                        <Text className="text-md font-semibold text-white">
                                                            {formatTime(event.startTime?.toDate()!)}
                                                        </Text>
                                                    </View>
                                                </LinearGradient>
                                                {hasPrivileges && (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            navigation.navigate("QRCode", { event: event });
                                                        }}
                                                        className="absolute right-0 top-0 p-2 m-2 rounded-full"
                                                        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                                                    >
                                                        <FontAwesome6 name="qrcode" size={24} color="white" />
                                                    </TouchableOpacity>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Upcoming Events */}
                                {selectedEvents.upcoming.length !== 0 && (
                                    <View className="mt-8">
                                        <Text className={`mb-3 text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                                            Upcoming Events
                                        </Text>
                                        {selectedEvents.upcoming.map((event: SHPEEvent, index) => (
                                            <View key={event.id} className={`${index > 0 && "mt-8"}`}>
                                                <EventCard event={event} navigation={navigation} />
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Past Events */}
                                {selectedEvents.past.length !== 0 && (
                                    <View className="mt-8">
                                        <Text className={`mb-3 text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                                            Past Events
                                        </Text>
                                        {selectedEvents.past.map((event: SHPEEvent, index) => (
                                            <View key={index} className={`${index > 0 && "mt-8"}`}>
                                                <EventCard event={event} navigation={navigation} />
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <TouchableOpacity onPress={() => navigation.navigate("PastEvents")}>
                                    <Text className="text-xl text-primary-blue mt-8 underline">View all past events</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View className='pb-24' />
            </ScrollView>

            {/* Create Event */}
            {hasPrivileges && (
                <TouchableOpacity
                    className='absolute bottom-0 right-0 bg-primary-blue rounded-full h-14 w-14 shadow-lg justify-center items-center m-4'
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
                    onPress={() => navigation.navigate("CreateEvent")}
                >
                    <Octicons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 space-y-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ minWidth: 325 }}
                >
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color={darkMode ? "white" : "black"} />
                            <Text className={`text-2xl font-semibold ml-2 ${darkMode ? "text-white" : "text-black"}`}>FAQ</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                            How to Find Committee Meetings
                        </Text>
                        <Text className={`text-md ${darkMode ? "text-white" : "text-black"}`}>
                            Meetings are listed under the respective committee in the committee tab or can be filtered by "committee meetings" on this screen.
                        </Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                            Event Location Check
                        </Text>
                        <Text className={`text-md ${darkMode ? "text-white" : "text-black"}`}>
                            The location check only happens during scans; we do not track you continuously. If a sign-out scan is required, you must be at the location to sign out.
                        </Text>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>
    );
};

type EventsProps = {
    filter?: ExtendedEventType;
    committee?: string;
    navigation: NativeStackNavigationProp<EventsStackParams>
}

type EventsScreenRouteProp = RouteProp<EventsStackParams, "EventsScreen">;


export default Events;
