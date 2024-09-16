import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform, Modal, Alert, ScrollView, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { RouteProp, useRoute } from '@react-navigation/core';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons, FontAwesome6, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from "../../config/firebaseConfig";
import { getAttendanceNumber, getPublicUserData, getUsers, signInToEvent, signOutOfEvent, getUserEventLog, fetchEventLogs, deleteEventLog } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { MillisecondTimes, formatEventDate, formatEventDateTime, formatEventTime } from '../../helpers/timeUtils';
import { EventType, SHPEEvent, SHPEEventLog, getStatusMessage } from '../../types/events';
import { Images } from '../../../assets';
import { StatusBar } from 'expo-status-bar';
import { handleLinkPress } from '../../helpers/links';
import { PublicUserInfo } from '../../types/user';
import { reverseFormattedFirebaseName } from '../../types/committees';
import MembersList from '../../components/MembersList';
import { EventProps, EventsStackParams } from '../../types/navigation';
import CalendarIconBlack from '../../../assets/calendar-days-solid_black.svg'
import CalendarIconWhite from '../../../assets/calendar-days-solid_white.svg'
import ClockIconBlack from '../../../assets/clock-solid_black.svg'
import ClockIconWhite from '../../../assets/clock-solid_white.svg'
import LocationDotIconBlack from '../../../assets/location-dot-solid_black.svg'
import LocationDotIconWhite from '../../../assets/location-dot-solid_white.svg'





const EventInfo = ({ navigation }: EventProps) => {
    const route = useRoute<EventInfoScreenRouteProp>();
    const { event } = route.params;
    const { name, description, eventType, startTime, endTime, coverImageURI, signInPoints, signOutPoints, pointsPerHour, locationName, geolocation, geofencingRadius, workshopType, committee, creator, nationalConventionEligible, startTimeBuffer, endTimeBuffer, id } = event || {};

    const insets = useSafeAreaInsets();

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const [creatorData, setCreatorData] = useState<PublicUserInfo | null>(null);
    const [loadingUserEventLog, setLoadingUserEventLog] = useState<boolean>(true);
    const [userEventLog, setUserEventLog] = useState<SHPEEventLog | null>(null);
    const [attendanceCounts, setAttendanceCounts] = useState<{ signedInCount: number, signedOutCount: number }>({ signedInCount: 0, signedOutCount: 0 });
    const [showOptionMenu, setShowOptionMenu] = useState<boolean>(false);

    const [users, setUsers] = useState<PublicUserInfo[]>([]);
    const [allUserFetched, setAllUserFetched] = useState<boolean>(false);
    const [forceUpdate, setForceUpdate] = useState<number>(0);
    const [signInModalVisible, setSignInModalVisible] = useState<boolean>(false);
    const [signOutModalVisible, setSignOutModalVisible] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [usersLogged, setUsersLogged] = useState<PublicUserInfo[]>([]);
    const [usersLoggedModalVisible, setUsersLoggedModalVisible] = useState<boolean>(false);
    const [loadingLog, setLoadingLog] = useState<boolean>(false);


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

    const fetchAllData = async () => {
        setLoadingLog(true);
        try {
            const userIds = await fetchEventLogs(id!);

            let filteredUsers: PublicUserInfo[] = [];

            if (!allUserFetched) {
                const fetchedUsers = await getUsers();
                filteredUsers = fetchedUsers.filter((user) => userIds.includes(user.uid!));

                setUsers(fetchedUsers);
                setAllUserFetched(true);
                setForceUpdate((prev) => prev + 1);
            } else {
                filteredUsers = users.filter((user) => userIds.includes(user.uid!));
            }

            setUsersLogged(filteredUsers);
        } catch (error) {
            console.error('Error fetching user logs:', error);
        } finally {
            setLoadingLog(false);
        }
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

    const isSameDay = (startDate: Date, endDate: Date): boolean => {
        return startDate.getDate() === endDate.getDate() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getFullYear() === endDate.getFullYear();
    };
    const sameDay = startTime && endTime && isSameDay(startTime.toDate(), endTime.toDate());



    return (
        <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} >
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
                                                        setSignInModalVisible(true)
                                                        fetchAllData();
                                                    }}
                                                >
                                                    <Text className='text-white text-xl py-3 font-medium'>Manual Sign In</Text>
                                                </TouchableOpacity>
                                                <View className='w-[70%] bg-white mx-4' style={{ height: 1 }} />
                                                <TouchableOpacity
                                                    className='px-4 py-3'
                                                    onPress={() => {
                                                        setShowOptionMenu(false);
                                                        setSignOutModalVisible(true)
                                                        fetchAllData();
                                                    }}
                                                >
                                                    <Text className='text-white text-xl font-medium'>Manual Sign Out</Text>
                                                </TouchableOpacity>
                                                <View className='w-[70%] bg-white' style={{ height: 1 }} />
                                                <TouchableOpacity
                                                    className="px-4 py-3"
                                                    onPress={() => {
                                                        setShowOptionMenu(false);
                                                        setUsersLoggedModalVisible(true);
                                                        fetchAllData();
                                                    }}
                                                >
                                                    <Text className="text-white text-xl font-medium">Manual Delete Log</Text>
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
                            onPress={() => {
                                navigation.navigate("QRCode", { event: event })
                                setShowOptionMenu(false)
                            }}
                            className='absolute right-0 bottom-0 p-3 rounded-full m-4 items-center justify-center'
                            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        >
                            <FontAwesome6 name="qrcode" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                <View className='-z-10'>
                    {hasPrivileges && !loading && (
                        <View
                            className={`flex-row w-full mx-4 mt-2 mb-1 ${signInPoints !== undefined && signOutPoints !== undefined ? 'justify-between' : 'justify-center'
                                }`}
                        >
                            {signInPoints !== undefined && (
                                <View className={`flex-row ${signOutPoints === undefined ? 'w-full' : 'w-[50%]'}`}>
                                    <Octicons name="sign-in" size={24} color={darkMode ? 'white' : 'black'} />
                                    <Text className={`ml-2 text-xl ${darkMode ? 'text-white' : 'text-black'}`}>
                                        {attendanceCounts.signedInCount} Member
                                    </Text>
                                </View>
                            )}

                            {signOutPoints !== undefined && (
                                <View className={`flex-row ${signInPoints === undefined ? 'w-full' : 'w-[50%]'}`}>
                                    <Octicons name="sign-out" size={24} color={darkMode ? 'white' : 'black'} />
                                    <Text className={`ml-2 text-xl ${darkMode ? 'text-white' : 'text-black'}`}>
                                        {attendanceCounts.signedOutCount} Member
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* General Details */}
                    {nationalConventionEligible && (
                        <Text className={`mt-2 text-md mx-4 ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>This event is eligible for national convention requirements*
                        </Text>
                    )}

                    {(eventType === EventType.STUDY_HOURS) && (
                        <Text className={`mt-2 text-md mx-4 ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>
                            Feel free to leave the area. Just be sure to scan in and out at the event location to fully earn your points!
                        </Text>
                    )}

                    {loading && (<ActivityIndicator size="small" className='mt-3' />)}


                    <View className='mx-4 mt-3'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        <Text className={`text-lg ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                            {eventType}
                            {committee && (" • " + reverseFormattedFirebaseName(committee))} • {calculateMaxPossiblePoints(event)} points • {creatorData?.name}
                        </Text>
                    </View>

                    {/* Date, Time and Location */}
                    <View className={`mt-6 mx-4`}>
                        <View className='flex-row items-center'>
                            <View className='mr-2'>
                                {darkMode ? <CalendarIconWhite width={25} height={25} /> : <CalendarIconBlack width={25} height={25} />}
                            </View>
                            <Text className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                                {(startTime && endTime) ?
                                    (sameDay ?
                                        formatEventDate(startTime.toDate(), endTime.toDate())
                                        : formatEventDateTime(startTime.toDate(), endTime.toDate())
                                    )
                                    : ""
                                }
                            </Text>
                        </View>


                        {sameDay && (
                            <View className='flex-row items-center mt-4'>
                                <View className='mr-2'>
                                    {darkMode ? <ClockIconWhite width={25} height={25} /> : <ClockIconBlack width={25} height={25} />}
                                </View>
                                <Text className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                                    {startTime && endTime && formatEventTime(startTime.toDate(), endTime.toDate())}
                                </Text>
                            </View>
                        )}

                        {locationName && (
                            <View className='mt-4'>
                                <View className='flex-row flex-wrap items-center'>
                                    {geolocation ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (Platform.OS === 'ios') {
                                                    handleLinkPress(`http://maps.apple.com/?daddr=${geolocation.latitude},${geolocation.longitude}`);
                                                } else if (Platform.OS === 'android') {
                                                    handleLinkPress(`https://www.google.com/maps/dir/?api=1&destination=${geolocation.latitude},${geolocation.longitude}`);
                                                }
                                            }}
                                            className='flex-row items-center'
                                        >
                                            <View className='mr-2'>
                                                {darkMode ? <LocationDotIconWhite width={25} height={25} /> : <LocationDotIconBlack width={25} height={25} />}
                                            </View>
                                            <Text className={`text-lg font-semibold text-primary-blue`}>
                                                {locationName}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                                            {locationName}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                    </View>

                    {/* Description */}
                    {(description && description.trim() != "") && (
                        <View className='mx-4 mt-10'>
                            <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Description</Text>
                            <Text className={`text-lg ${darkMode ? "text-grey-light" : "text-black"}`}>{description}</Text>
                        </View>
                    )}

                    <View className='pb-40' />
                </View>
            </ScrollView>

            {!loadingUserEventLog && (
                <View className='absolute w-full bottom-0 mb-5 z-50 justify-center items-center'>
                    <View className='w-full'>
                        <TouchableOpacity
                            onPress={() => { navigation.navigate("QRCodeScanningScreen") }}
                            disabled={!(eventButtonState == EventButtonState.SIGN_IN || eventButtonState == EventButtonState.SIGN_OUT)}
                            className={`h-14 items-center justify-center rounded-xl mx-4 ${(eventButtonState == EventButtonState.SIGN_IN || eventButtonState == EventButtonState.SIGN_OUT) ? "bg-primary-blue" : `${darkMode ? "bg-secondary-bg-dark border border-grey-light" : "bg-secondary-bg-light border border-grey-dark"}`}`}
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
                                <Text className={`text-center ${darkMode ? 'text-grey-light' : 'text-grey-dark'} text-xl`}>This event has not started</Text>
                            )}
                            {eventButtonState === EventButtonState.EVENT_OVER && (
                                <Text className={`text-center ${darkMode ? 'text-grey-light' : 'text-grey-dark'} text-xl`}>This event is over</Text>
                            )}
                            {eventButtonState === EventButtonState.RECEIVED_POINTS && (
                                <View>
                                    <Text className={`text-center ${darkMode ? 'text-grey-light' : 'text-grey-dark'} text-xl`}>You received {userEventLog?.points} points for this event </Text>
                                    <Text className={`text-center ${darkMode ? 'text-grey-light' : 'text-grey-dark'}`}>Points will be updated later after verification. No action needed.</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    {((eventButtonState === EventButtonState.SIGN_IN || eventButtonState === EventButtonState.SIGN_OUT) && (geolocation && geofencingRadius)) && (
                        <View
                            className="mt-2 mx-4 px-1 py-1 rounded-md mb-1 justify-center items-center"
                            style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }}
                        >
                            <Text className={darkMode ? 'text-white' : 'text-black'}>You must be at the location to scan the QRCode.</Text>
                        </View>
                    )}
                </View>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={signInModalVisible}
                onRequestClose={() => {
                    setSignInModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? 'text-white' : 'text-black'}`}>Manual Sign In</Text>
                        </View>

                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setSignInModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {(!allUserFetched || loadingLog || loading) && (
                        <ActivityIndicator className="mb-2" size="small" />
                    )}

                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        {!loadingLog && (
                            <MembersList
                                key={forceUpdate}
                                handleCardPress={(uid) => {
                                    Alert.alert(
                                        `Confirm sign in`,
                                        `Are you sure you want to sign in this member?`,
                                        [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                                onPress: () => {
                                                    setLoading(false);
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: async () => {
                                                    setLoading(true);

                                                    await signInToEvent(event.id!, uid).then((status) => {
                                                        Alert.alert('Status', getStatusMessage(status, "sign-in"), [
                                                            {
                                                                text: 'OK',
                                                                onPress: () => {
                                                                    fetchAttendanceCounts();
                                                                },
                                                            },
                                                        ]);
                                                    });
                                                    setSignInModalVisible(false);
                                                },
                                            },
                                        ],
                                        { cancelable: false }
                                    );
                                }}
                                users={users}
                            />
                        )}
                    </View>
                </View>
            </Modal>


            <Modal
                animationType="slide"
                transparent={true}
                visible={signOutModalVisible}
                onRequestClose={() => {
                    setSignOutModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? 'text-white' : 'text-black'}`}>Manual Sign Out</Text>
                        </View>

                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setSignOutModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {(!allUserFetched || loadingLog) && (
                        <ActivityIndicator className="mb-2" size="small" />
                    )}

                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        {!loadingLog && (
                            <MembersList
                                key={forceUpdate + 1}
                                handleCardPress={(uid) => {
                                    Alert.alert(
                                        `Confirm sign out`,
                                        `Are you sure you want to sign out this member?`,
                                        [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                                onPress: () => {
                                                    setLoading(false);
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: async () => {
                                                    setLoading(true);

                                                    await signOutOfEvent(event.id!, uid).then((status) => {
                                                        Alert.alert('Status', getStatusMessage(status, "sign-out"), [
                                                            {
                                                                text: 'OK',
                                                                onPress: () => {
                                                                    fetchAttendanceCounts();
                                                                },
                                                            },
                                                        ]);
                                                    });
                                                    setSignOutModalVisible(false);
                                                },
                                            },
                                        ],
                                        { cancelable: false }
                                    );
                                }}
                                users={users}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={usersLoggedModalVisible}
                onRequestClose={() => {
                    setUsersLoggedModalVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className="flex-row items-center h-10 mb-4">
                        <View className="w-screen absolute">
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? 'text-white' : 'text-black'}`}>
                                Select a Member
                            </Text>
                        </View>

                        <TouchableOpacity
                            className="ml-6 px-4"
                            onPress={() => setUsersLoggedModalVisible(false)}
                        >
                            <Octicons name="x" size={26} color={darkMode ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>

                    {loadingLog && (
                        <ActivityIndicator className="mb-2" size="small" />
                    )}

                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>

                        {!loadingLog && (
                            <MembersList
                                handleCardPress={(uid) => {
                                    Alert.alert(
                                        `Confirm Deletion`,
                                        `Are you sure you want to delete the log for this member?`,
                                        [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                                onPress: () => {
                                                    setLoading(false);
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: async () => {
                                                    setLoading(true);

                                                    await deleteEventLog(event.id!, uid).then((status) => {
                                                        Alert.alert("Status", status, [
                                                            {
                                                                text: 'OK',
                                                                onPress: () => {
                                                                    fetchAttendanceCounts();
                                                                },
                                                            }
                                                        ])
                                                    })

                                                    setUsersLoggedModalVisible(false)

                                                },
                                            },
                                        ],
                                        { cancelable: false }
                                    );
                                }}
                                users={usersLogged}
                            />
                        )}
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