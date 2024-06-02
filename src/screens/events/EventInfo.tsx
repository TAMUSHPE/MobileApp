import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, Platform, Modal } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/core';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { auth } from "../../config/firebaseConfig";
import { getEvent, getAttendanceNumber, isUserSignedIn, getPublicUserData, getUsers, signInToEvent, signOutOfEvent } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { formatEventDate, formatTime } from '../../helpers/timeUtils';
import { SHPEEvent, getStatusMessage } from '../../types/events';
import { Images } from '../../../assets';
import { StatusBar } from 'expo-status-bar';
import CalendarIcon from '../../../assets/calandar_pale_blue.svg'
import ClockIcon from '../../../assets/clock-pale-blue.svg'
import MapIcon from '../../../assets/map-pale-blue.svg'
import TargetIcon from '../../../assets/target-pale-blue.svg'
import { handleLinkPress } from '../../helpers/links';
import MemberCard from '../../components/MemberCard';
import { PublicUserInfo } from '../../types/user';
import { reverseFormattedFirebaseName } from '../../types/committees';
import MembersList from '../../components/MembersList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/navigation';


const EventInfo: React.FC<EventScreenRouteProp> = ({ route, navigation }) => {
    const { eventId } = route.params
    const { userInfo } = useContext(UserContext)!;
    const [event, setEvent] = useState<SHPEEvent>();
    const [creatorData, setCreatorData] = useState<PublicUserInfo | null>(null)
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [attendance, setAttendance] = useState<number>(0);
    const [allUserFetched, setAllUserFetched] = useState(false);
    const [users, setUsers] = useState<PublicUserInfo[]>([]);
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [userSignInOut, setUserSignInOut] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    const { name, description, eventType, startTime, endTime, coverImageURI, signInPoints, signOutPoints, pointsPerHour, locationName, geolocation, workshopType, committee, creator, nationalConventionEligible } = event || {};

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const insets = useSafeAreaInsets();


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
                    setAttendance(attendanceCount);
                    console.log(attendanceCount)
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


    useEffect(() => {
        const fetchCreatorInfo = async () => {
            if (creator) {
                const fetchedCreator = await getPublicUserData(creator);
                setCreatorData(fetchedCreator || null);
            }
        }

        fetchCreatorInfo();
    }, [creator])


    if (!event) {
        return (
            <View className='h-screen w-screen justify-center items-center'>
                <ActivityIndicator size="large" />
            </View>
        )
    }

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
                            onPress={() => { navigation.goBack(); }}
                            className="rounded-full w-10 h-10 justify-center items-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                        >
                            <Octicons name="chevron-left" size={30} color="white" />
                        </TouchableOpacity>

                        {userSignedIn && (
                            <View
                                className="flex-row rounded-lg justify-center items-center px-4 py-2"
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                            >
                                <Text className='text-white text-lg font-bold'>You are signed in</Text>
                                <View className='h-6 w-6 bg-[#AEF359] rounded-full items-center justify-center ml-2'>
                                    <Octicons name="check" size={16} color="black" />
                                </View>
                            </View>
                        )}

                        {/* TODO: bug here navagating back from home */}
                        <View className='flex-col relative items-center'>
                            {hasPrivileges &&
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("UpdateEvent", { event })}
                                    className="rounded-lg px-3 py-3"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                                >
                                    <Octicons name="pencil" size={24} color="white" />
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Body */}
            <View className='my-4 mx-5'>
                {hasPrivileges && (
                    <View className='w-full items-center justify-center'>
                        <Text className='text-lg italic font-semibold mb-2'>Attendance: {attendance}</Text>
                    </View>
                )}

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

                {event.general && (
                    <View className='flex-row mt-1'>
                        <TargetIcon width={20} height={20} />
                        <Text className={`text-lg ml-2`}>Club-Wide Event</Text>
                    </View>
                )}
                {creatorData && (
                    <View className='mt-4'>
                        <Text className='text-xl mt-2 italic font-bold mb-2'>Event Host</Text>
                        <MemberCard userData={creatorData} />
                    </View>
                )}


                {/* Admin Only - Sign in/out user */}
                <View className=''>
                    {(typeof event.signInPoints === 'number' && hasPrivileges) && (
                        <TouchableOpacity
                            className='bg-pale-blue p-2 rounded-md'
                            onPress={() => {
                                setUserSignInOut("signIn")
                                setUserModalVisible(true)
                                if (!allUserFetched) {
                                    fetchAllUsers();
                                }
                            }}>
                            <Text className='text-white'>
                                Manually Sign In a user
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {(typeof event.signOutPoints === 'number' && hasPrivileges) && (
                    <TouchableOpacity
                        onPress={() => {
                            setUserSignInOut("signOut")
                            setUserModalVisible(true)
                            if (!allUserFetched) {
                                fetchAllUsers();
                            }
                        }}
                        className='bg-pale-blue p-2 rounded-md mt-4'
                    >
                        <Text className='text-white'>
                            Manually Sign Out a user
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View className='pb-40' />

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
                                setLoading(true)
                                console.log(uid)
                                if (userSignInOut == "signIn") {
                                    signInToEvent(eventId, uid).then((status) => {
                                        setLoading(false)
                                        alert(getStatusMessage(status))
                                    })
                                } else if (userSignInOut == "signOut") {
                                    signOutOfEvent(eventId, uid).then((status) => {
                                        setLoading(false)
                                        alert(getStatusMessage(status))
                                    })
                                }
                                setUserModalVisible(false)
                            }}
                            users={users}
                        />
                    </View>
                </View>
            </Modal>

            {loading && (
                <View className='absolute w-full h-full bg-[#00000055] items-center justify-center'>
                    <ActivityIndicator size="large" color={"white"} />
                </View>

            )}

        </ScrollView>
    )
}

export type EventScreenRouteProp = {
    route: RouteProp<EventsStackParams, 'EventInfo'>;
    navigation: NativeStackNavigationProp<EventsStackParams, 'EventInfo'>;
};


export default EventInfo