import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Alert, ScrollView, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { RouteProp, useRoute } from '@react-navigation/core';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons, FontAwesome6, Entypo } from '@expo/vector-icons';
import { auth } from "../../config/firebaseConfig";
import { getAttendanceNumber, getPublicUserData, getUsers, signInToEvent, signOutOfEvent, getUserEventLog } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { MillisecondTimes, formatEventDate, formatEventTime } from '../../helpers/timeUtils';
import { SHPEEvent, SHPEEventLog, getStatusMessage } from '../../types/events';
import { Images } from '../../../assets';
import { StatusBar } from 'expo-status-bar';
import { handleLinkPress } from '../../helpers/links';
import { PublicUserInfo } from '../../types/user';
import { reverseFormattedFirebaseName } from '../../types/committees';
import MembersList from '../../components/MembersList';
import { EventProps, EventsStackParams } from '../../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';

const EventInfo = ({ navigation }: EventProps) => {
    const route = useRoute<EventInfoScreenRouteProp>();
    const { event } = route.params;
    const { name, description, eventType, startTime, endTime, coverImageURI, signInPoints, signOutPoints, pointsPerHour, locationName, geolocation, geofencingRadius, workshopType, committee, creator, nationalConventionEligible, startTimeBuffer, endTimeBuffer } = event || {};

    const insets = useSafeAreaInsets();

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;


    console.log(darkMode, "darkmode")
    console.log(colorScheme, "colorScheme")

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const [creatorData, setCreatorData] = useState<PublicUserInfo | null>(null);
    const [loadingUserEventLog, setLoadingUserEventLog] = useState<boolean>(true);
    const [userEventLog, setUserEventLog] = useState<SHPEEventLog | null>(null);
    const [attendanceCounts, setAttendanceCounts] = useState<{ signedInCount: number, signedOutCount: number }>({ signedInCount: 0, signedOutCount: 0 });
    const [showOptionMenu, setShowOptionMenu] = useState<boolean>(false);

    const [users, setUsers] = useState<PublicUserInfo[]>([]);
    const [allUserFetched, setAllUserFetched] = useState<boolean>(false);
    const [forceUpdate, setForceUpdate] = useState<number>(0);
    const [userSignInOut, setUserSignInOut] = useState<string>("signIn");
    const [userModalVisible, setUserModalVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchAttendanceCounts = async () => {
        setLoading(true);
        const counts = await getAttendanceNumber(event.id!);
        setAttendanceCounts(counts);
        setLoading(false)
    }

    useEffect(() => {
        const fetchUserEventLog = async () => {
            setLoadingUserEventLog(true);
            const res = await getUserEventLog(event.id!, auth.currentUser?.uid!);
            setUserEventLog(res);
            setLoadingUserEventLog(false);
        }

        fetchUserEventLog();
        fetchAttendanceCounts();
    }, [])

    useEffect(() => {
        const fetchCreatorInfo = async () => {
            if (creator) {
                const fetchedCreator = await getPublicUserData(creator);
                setCreatorData(fetchedCreator || null);
            }
        }

        fetchCreatorInfo();
    }, [creator])

    const fetchAllUsers = async () => {
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
            setAllUserFetched(true);
        } catch (error) {
            console.error("An error occurred while fetching users: ", error);
        }
        setForceUpdate(prev => prev + 1);
    };


    const getEventButtonState = (event: SHPEEvent, userEventLog: SHPEEventLog | null): EventButtonState => {
        const now = new Date();

        // Event has not started
        if (now < new Date(startTime!.toDate().getTime() - (startTimeBuffer || 0))) {
            return EventButtonState.NOT_STARTED;
        }

        // Event Ended
        if (now > new Date(endTime!.toDate().getTime() + (endTimeBuffer || 0))) {
            if (userEventLog?.signInTime || userEventLog?.signOutTime) {
                return EventButtonState.RECEIVED_POINTS;
            }
            return EventButtonState.EVENT_OVER;
        }

        // Event is on-going
        if (userEventLog?.signOutTime) {
            return EventButtonState.RECEIVED_POINTS;
        }
        if (userEventLog?.signInTime) {
            if (signOutPoints != null) {
                return EventButtonState.SIGN_OUT;
            }
            return EventButtonState.RECEIVED_POINTS;
        }
        return EventButtonState.SIGN_IN;

    }

    const eventButtonState = getEventButtonState(event, userEventLog);

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
                        defaultSource={Images.SHPE_NAVY}
                        source={coverImageURI ? { uri: coverImageURI } : Images.SHPE_NAVY}
                        style={{
                            width: "100%",
                            height: "auto",
                            aspectRatio: 16 / 9,
                        }}
                    />

                    <LinearGradient
                        colors={['rgba(255,255,255,.7)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                        className='absolute w-full'
                        style={{ height: insets.top + 30 }}
                    ></LinearGradient>

                    <SafeAreaView edges={['top']}>
                        <View className='flex-row justify-between mx-4 h-full'>
                            <TouchableOpacity
                                onPress={() => { navigation.goBack(); }}
                                className="rounded-full w-10 h-10 justify-center items-center"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                            >
                                <Octicons name="chevron-left" size={30} color="white" />
                            </TouchableOpacity>
                            {hasPrivileges && (
                                <View className=''>
                                    <TouchableOpacity
                                        onPress={() => { setShowOptionMenu(!showOptionMenu) }}
                                        className='absolute top-0 right-0 p-2 rounded-full items-center justify-center'
                                        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                                    >
                                        <Entypo name="dots-three-vertical" size={24} color="white" />
                                    </TouchableOpacity>
                                    {showOptionMenu && (
                                        <View>
                                            <TouchableOpacity onPress={() => { setShowOptionMenu(false) }} className='absolute -right-4 w-screen h-screen z-10' />

                                            <View className='absolute right-10 top-5 rounded-md items-center z-20'
                                                style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                                            >
                                                <TouchableOpacity
                                                    className='px-4'
                                                    onPress={() => {
                                                        setShowOptionMenu(false);
                                                        navigation.navigate("UpdateEvent", { event: event })
                                                    }}
                                                >
                                                    <Text className='text-white text-xl py-3 font-medium'>Edit Event</Text>
                                                </TouchableOpacity>
                                                <View className='w-[70%] bg-white' style={{ height: 1 }} />
                                                <TouchableOpacity
                                                    className='px-4'
                                                    onPress={() => {
                                                        setShowOptionMenu(false);
                                                        setUserSignInOut("signIn")
                                                        setUserModalVisible(true)
                                                        if (!allUserFetched) {
                                                            fetchAllUsers();
                                                        }
                                                    }}
                                                >
                                                    <Text className='text-white text-xl py-3 font-medium'>Manual Sign In</Text>
                                                </TouchableOpacity>
                                                <View className='w-[70%] bg-white mx-4' style={{ height: 1 }} />
                                                <TouchableOpacity
                                                    className='px-4 py-3'
                                                    onPress={() => {
                                                        setShowOptionMenu(false);
                                                        setUserSignInOut("signOut")
                                                        setUserModalVisible(true)
                                                        if (!allUserFetched) {
                                                            fetchAllUsers();
                                                        }
                                                    }}
                                                >
                                                    <Text className='text-white text-xl font-medium'>Manual Sign Out</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </SafeAreaView>

                    {hasPrivileges && (
                        <TouchableOpacity
                            onPress={() => { navigation.navigate("QRCode", { event: event }) }}
                            className='absolute right-0 bottom-0 p-3 rounded-full m-4 items-center justify-center -z-10'
                            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        >
                            <FontAwesome6 name="qrcode" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                <View className='-z-10'>
                    {/* General Details */}
                    {nationalConventionEligible && (<Text className={`text-center mt-1 text-md text-grey-dark`}>This event is eligible for national convention requirements*</Text>)}

                    {loading && (<ActivityIndicator size="small" className='mt-3' />)}

                    {(hasPrivileges && !loading) && (
                        <View className="flex-row w-full mx-4 mt-2">
                            <View className='flex-row w-[50%]'>
                                <Octicons name="sign-in" size={24} color="black" />
                                <Text className='ml-2 text-xl text-black '>{attendanceCounts.signedInCount || 0} Member</Text>
                            </View>

                            {signInPoints && (
                                <View className='flex-row flex-1'>
                                    <Octicons name="sign-out" size={24} color="black" />
                                    <Text className='ml-2 text-xl text-black '>{attendanceCounts.signedOutCount || 0} Member</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View className='mx-4 mt-3'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        <Text className={`text-lg text-grey-dark`}>{eventType}{committee && (" • " + reverseFormattedFirebaseName(committee))} • {calculateMaxPossiblePoints(event)} points</Text>
                        <Text className={`text-lg text-grey-dark`}>Hosted By {creatorData?.name}</Text>
                    </View>

                    {/* Date, Time and Location */}
                    <View className='mt-6 mx-4 p-4 bg-secondary-bg-light rounded-lg'
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
                                <Text className='text-lg text-grey-dark'>Date</Text>
                                <Text className='text-xl text-black font-bold'>{(startTime && endTime) ? formatEventDate(startTime.toDate(), endTime.toDate()) : ""}</Text>
                            </View>

                            <View className='flex-1'>
                                <Text className='text-lg text-grey-dark'>Time</Text>
                                <Text className='text-xl text-black font-bold'>{startTime && endTime && formatEventTime(startTime.toDate(), endTime.toDate())}</Text>
                            </View>
                        </View>
                        {locationName && (
                            <View className='mt-4'>
                                <Text className='text-lg text-grey-dark'>Location</Text>
                                <View className='flex-row items-center flex-1 flex-wrap'>
                                    <Text className='text-xl text-black font-bold'>{locationName}     {geolocation && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (Platform.OS === 'ios') {
                                                    handleLinkPress(`http://maps.apple.com/?daddr=${geolocation.latitude},${geolocation.longitude}`);
                                                } else if (Platform.OS === 'android') {
                                                    handleLinkPress(`https://www.google.com/maps/dir/?api=1&destination=${geolocation.latitude},${geolocation.longitude}`);
                                                }
                                            }}
                                        >
                                            <Text className='underline text-primary-blue font-semibold'>View in Maps</Text>
                                        </TouchableOpacity>
                                    )}
                                    </Text>

                                </View>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {(description && description.trim() != "") && (
                        <View className='mx-4 mt-6'>
                            <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>About Event</Text>
                            <Text className={`text-lg text-black`}>{description}</Text>
                        </View>
                    )}

                    <View className='pb-20' />
                </View>
            </ScrollView >
            {!loadingUserEventLog && (
                <View className='absolute w-full bottom-0 mb-5 z-50 justify-center items-center'>
                    <View className='w-full'>
                        <TouchableOpacity
                            onPress={() => { navigation.navigate("QRCodeScanningScreen") }}
                            disabled={!(eventButtonState == EventButtonState.SIGN_IN || eventButtonState == EventButtonState.SIGN_OUT)}
                            className={`bg-primary-blue h-14 items-center justify-center rounded-xl mx-4 ${(eventButtonState == EventButtonState.SIGN_IN || eventButtonState == EventButtonState.SIGN_OUT) ? "bg-primary-blue" : "bg-secondary-bg-light border border-grey-dark"}`}
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
                            {eventButtonState === EventButtonState.SIGN_IN && (
                                <Text className='text-center text-white text-2xl font-bold'>Sign In</Text>
                            )}
                            {eventButtonState === EventButtonState.SIGN_OUT && (
                                <Text className='text-center text-white text-2xl font-bold'>Sign Out</Text>
                            )}
                            {eventButtonState === EventButtonState.NOT_STARTED && (
                                <Text className='text-center text-grey-dark text-xl'>This event has not started</Text>
                            )}
                            {eventButtonState === EventButtonState.EVENT_OVER && (
                                <Text className='text-center text-grey-dark text-xl'>This event is over</Text>
                            )}
                            {eventButtonState === EventButtonState.RECEIVED_POINTS && (
                                <View>
                                    <Text className='text-center text-grey-dark text-xl'>You received {userEventLog?.points} points for this event </Text>
                                    <Text className='text-center text-grey-dark'>Points will be updated later after verification. No action needed.</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    {((eventButtonState === EventButtonState.SIGN_IN || eventButtonState === EventButtonState.SIGN_OUT) && (geolocation && geofencingRadius)) && (
                        <View
                            className="mt-2 mx-4 px-1 py-1 rounded-md mb-1 justify-center items-center"
                            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                        >
                            <Text>You must be at the location to scan the QRCode.</Text>
                        </View>
                    )}
                </View>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={userModalVisible}
                onRequestClose={() => {
                    setUserModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'
                >

                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select a Member</Text>
                        </View>

                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setUserModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>
                    </View>

                    {!allUserFetched && (
                        <ActivityIndicator className="mb-2" size="small" />
                    )}


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList
                            key={forceUpdate}
                            handleCardPress={(uid) => {
                                if (userSignInOut === "signIn") {
                                    signInToEvent(event.id!, uid).then((status) => {
                                        Alert.alert(
                                            'Status',
                                            getStatusMessage(status),
                                            [{ text: 'OK', onPress: () => { fetchAttendanceCounts(); } }],
                                            { cancelable: false }
                                        );
                                    });
                                } else if (userSignInOut === "signOut") {
                                    signOutOfEvent(event.id!, uid).then((status) => {
                                        Alert.alert(
                                            'Status',
                                            getStatusMessage(status),
                                            [{ text: 'OK', onPress: () => { fetchAttendanceCounts(); } }],
                                            { cancelable: false }
                                        );
                                    });
                                }
                                setUserModalVisible(false);
                            }}
                            users={users}
                        />
                    </View>
                </View>
            </Modal>
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

enum EventButtonState {
    NOT_STARTED = "Event has not started",
    EVENT_OVER = "Event is over",
    RECEIVED_POINTS = "You receive points for this event",
    SIGN_OUT = "Sign out of this event",
    SIGN_IN = "Sign in",
}

export type EventInfoScreenRouteProp = RouteProp<EventsStackParams, "EventInfo">;

export default EventInfo