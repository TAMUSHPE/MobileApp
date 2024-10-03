import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme, Image, Modal, Alert } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/core';
import { Octicons, Entypo } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../config/firebaseConfig';
import { checkCommitteeRequestStatus, getCommitteeEvents, getCommitteeMembers, getPublicUserData, removeCommitteeRequest, setPublicUserData, submitCommitteeRequest } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { Images } from '../../../assets';
import { handleLinkPress } from '../../helpers/links';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { getLogoComponent } from '../../types/committees';
import { EventType, SHPEEvent } from '../../types/events';
import { PublicUserInfo } from '../../types/user';
import { CommitteesStackParams } from '../../types/navigation';
import MembersList from '../../components/MembersList';
import EventCard from '../events/EventCard';

const CommitteeInfo: React.FC<CommitteeInfoScreenRouteProps> = ({ route, navigation }) => {
    const initialCommittee = route.params.committee;
    const { name, logo, description, applicationLink, firebaseDocName, isOpen, memberCount } = initialCommittee;
    const { LogoComponent, LightLogoComponent, height, width } = getLogoComponent(logo);

    const insets = useSafeAreaInsets();

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const [events, setEvents] = useState<SHPEEvent[]>([]);
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [membersListVisible, setMembersListVisible] = useState<boolean>(false);
    const [isInCommittee, setIsInCommittee] = useState<boolean>();
    const [isRequesting, setIsRequesting] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [loadingEvent, setEventLoading] = useState<boolean>(true);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
    const [loadingLabel, setLoadingLabel] = useState<boolean>(true);
    const [loadingTeamMembers, setLoadingTeamMembers] = useState<boolean>(true);

    const [localTeamMembers, setLocalTeamMembers] = useState<TeamMembersState>({
        leads: [],
        representatives: [],
        head: null,
    });

    const fetchTeamMemberData = async () => {
        if (initialCommittee) {
            const { head, representatives, leads } = initialCommittee;
            const newTeamMembers: TeamMembersState = { leads: [], representatives: [], head: null };

            if (head) {
                const headData = await getPublicUserData(head);
                if (headData) {
                    headData.uid = head;
                    newTeamMembers.head = headData;
                }
            }

            if (representatives && representatives.length > 0) {
                newTeamMembers.representatives = await Promise.all(
                    representatives.map(async (uid) => {
                        const repData = await getPublicUserData(uid);
                        if (repData) {
                            repData.uid = uid;
                        }
                        return repData;
                    })
                );
            }

            if (leads && leads.length > 0) {
                newTeamMembers.leads = await Promise.all(
                    leads.map(async (uid) => {
                        const leadData = await getPublicUserData(uid);
                        if (leadData) {
                            leadData.uid = uid;
                        }
                        return leadData;
                    })
                );
            }

            setLocalTeamMembers(newTeamMembers);
            setLoadingTeamMembers(false)
        }
    };

    useEffect(() => {
        const fetchEvents = async () => {
            setEventLoading(true);
            const response = await getCommitteeEvents([firebaseDocName!]);
            setEvents(response);
            setEventLoading(false);
        }

        const checkStatus = async () => {
            setLoadingLabel(true);

            const committeeExists = userInfo?.publicInfo?.committees?.includes(firebaseDocName!);
            if (auth.currentUser && !committeeExists && !isOpen) {
                const isRequest = await checkCommitteeRequestStatus(firebaseDocName!, auth.currentUser.uid);
                setIsRequesting(isRequest);
            }

            setLoadingLabel(false);
        };


        fetchEvents();
        fetchTeamMemberData();
        checkStatus();
    }, [])

    useEffect(() => {
        const committeeExists = userInfo?.publicInfo?.committees?.includes(firebaseDocName!);
        setIsInCommittee(committeeExists);
    }, [userInfo]);

    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchTeamMemberData();
            }
        }, [fetchTeamMemberData])
    );

    const updateUserInfo = async (updatedCommittees: string[]) => {
        try {
            await setPublicUserData({ committees: updatedCommittees });

            const updatedUserInfo = {
                ...userInfo,
                publicInfo: {
                    ...userInfo?.publicInfo,
                    committees: updatedCommittees,
                },
            };

            await AsyncStorage.setItem('@user', JSON.stringify(updatedUserInfo));
            setUserInfo(updatedUserInfo);
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    };

    const joinCommittee = async () => {
        const updatedCommittees = [...(userInfo?.publicInfo?.committees || []), firebaseDocName!].filter(Boolean) as string[];
        await updateUserInfo(updatedCommittees);
        setForceUpdate(0)
    };

    const leaveCommittee = async () => {
        const updatedCommittees = userInfo?.publicInfo?.committees?.filter(c => c !== firebaseDocName) || [];
        await updateUserInfo(updatedCommittees);
        setForceUpdate(0)
    };

    const requestToJoinCommittee = async () => {
        await submitCommitteeRequest(firebaseDocName!, auth.currentUser?.uid!);
        setIsRequesting(true);
    };

    const cancelRequest = async () => {
        await removeCommitteeRequest(firebaseDocName!, auth.currentUser?.uid!);
        setIsRequesting(false);
    };

    const handleJoinLeave = async () => {
        setLoadingLabel(true);
        if (isInCommittee) {
            await leaveCommittee();
        } else if (isOpen) {
            await joinCommittee();
        } else if (isRequesting) {
            await cancelRequest();
        } else {
            await requestToJoinCommittee();
        }
        setLoadingLabel(false);
    };

    const getButtonLabel = () => {
        if (isInCommittee) return 'Leave';
        if (isOpen) return 'Join';
        if (isRequesting) return 'Cancel Request';
        return 'Request to Join';
    };

    const buttonLabel = getButtonLabel();
    const isLeaveOrCancel = buttonLabel === 'Leave' || buttonLabel === 'Cancel Request';

    return (
        <SafeAreaView edges={['top']} className={`flex flex-col h-screen ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <StatusBar style={darkMode ? "light" : "dark"} />
                {/* Header */}
                <View className='flex-row items-center justify-between'>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-2 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                    {hasPrivileges && (
                        <TouchableOpacity
                            onPress={() => { navigation.navigate("CommitteeEditor", { committee: initialCommittee }) }}
                            className='items-center justify-center px-4 py-1'
                        >
                            <Entypo name="dots-three-vertical" size={24} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    )}
                </View>


                <View className='mx-4'>
                    <View className='flex-row mt-5 w-full'>
                        {/* Logo */}
                        <View className='items-center justify-center'>
                            <View
                                className={`h-28 w-28 rounded-lg items-center justify-center ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,

                                    elevation: 5,
                                }}>
                                {darkMode ?
                                    <LightLogoComponent height={height * .9} width={width * .9} />
                                    :
                                    <LogoComponent height={height * .9} width={width * .9} />
                                }
                            </View>
                            {isInCommittee && (
                                <View>
                                    {loadingLabel ?
                                        (
                                            <ActivityIndicator className="mb-2" size="small" />
                                        ) : (

                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Leave Committee",
                                                        "Are you sure you want to leave?",
                                                        [
                                                            {
                                                                text: "Cancel",
                                                                style: "cancel",
                                                            },
                                                            {
                                                                text: "Yes",
                                                                onPress: handleJoinLeave,
                                                            },
                                                        ],
                                                        { cancelable: true }
                                                    );
                                                }}
                                            >
                                                <Text className={`text-lg font-medium text-red-1 mt-1 line`}>Leave</Text>
                                            </TouchableOpacity>
                                        )}
                                </View>
                            )}
                        </View>

                        {/* General Details */}
                        <View className='ml-4 flex-1'>
                            {/* Special request from pres. to make this pink :) */}
                            <Text
                                className={`text-3xl font-bold text-wrap ${name!.toLowerCase() === "shpetinas" ? "text-pink-500" : darkMode ? "text-white" : "text-black"
                                    }`}
                            >
                                {name}
                            </Text>

                            <View className='flex-row items-center'>
                                <TouchableOpacity
                                    onPress={async () => {
                                        setMembersListVisible(true);
                                        if (forceUpdate == 1) {
                                            return;
                                        }

                                        setLoadingMembers(true);
                                        const committeeMembersRes = await getCommitteeMembers(firebaseDocName!);
                                        setMembers(committeeMembersRes);
                                        setLoadingMembers(false);
                                        setForceUpdate(1);
                                    }}
                                >
                                    <Text className={`text-lg font-medium ${darkMode ? "text-white" : "text-black"}`}>{memberCount} members</Text>
                                </TouchableOpacity>
                                <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}> • </Text>
                                <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{isOpen ? "Open" : "Private"}</Text>
                            </View>

                            <View>
                                {applicationLink && (
                                    <TouchableOpacity
                                        onPress={() => handleLinkPress(applicationLink)}
                                    >
                                        <Text className={`text-lg text-primary-blue underline`}>View Applications</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* About */}
                    {(description && description.trim()) && (
                        <View className='mt-4'>
                            <View className='mb-4'>
                                <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                                    About the committee
                                </Text>
                            </View>

                            <View
                                className={`px-3 py-2 rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}>
                                <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>
                                    {truncateStringWithEllipsis(description.trim(), 170)}
                                </Text>
                            </View>
                        </View>
                    )}


                    {/* Upcoming Events */}
                    <View className='mt-10'>
                        <View className='flex-row justify-between items-center mb-4'>
                            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Upcoming Events</Text>
                        </View>

                        <View
                            className={`px-3 py-4 rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            {loadingEvent ? (
                                <ActivityIndicator className="mt-2" size="small" />
                            ) : (
                                <View>
                                    {(events && events.length > 0) ? (
                                        <View>
                                            {events?.map((event: SHPEEvent, index) => {
                                                return (
                                                    <View key={event.id} className={`${index > 0 && "mt-8"}`}>
                                                        <EventCard event={event} navigation={navigation} />
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <View>
                                            <Text className={`text-lg text-center ${darkMode ? "text-white" : "text-black"}`}>No events, check again later.</Text>
                                        </View>

                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Meet the Team */}
                    <View className='mt-10'>
                        <View className='flex-row mb-4'>
                            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Meet the Team</Text>
                        </View>

                        <View
                            className={`px-3 py-4 rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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

                            {loadingTeamMembers ? (
                                <ActivityIndicator className="mb-2" size="small" />
                            ) : (

                                <View>
                                    {localTeamMembers.head && (
                                        <View className='flex-row'>
                                            <Image
                                                className="flex w-12 h-12 rounded-full mr-2"
                                                defaultSource={Images.DEFAULT_USER_PICTURE}
                                                source={localTeamMembers.head.photoURL ? { uri: localTeamMembers.head.photoURL } : Images.DEFAULT_USER_PICTURE}
                                            />
                                            <View className='flex-col'>
                                                <Text
                                                    className={`font-medium text-lg ${name!.toLowerCase() === "shpetinas" ? "text-pink-500" : darkMode ? 'text-grey-light' : 'text-grey-dark'
                                                        }`}
                                                >
                                                    Committee Head
                                                </Text>

                                                <Text className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
                                                    {localTeamMembers.head.name}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {localTeamMembers.representatives.map((rep, index) => (
                                        <View key={index} className='flex-row items-center mt-7'>
                                            <Image
                                                className="flex w-12 h-12 rounded-full mr-2"
                                                defaultSource={Images.DEFAULT_USER_PICTURE}
                                                source={rep?.photoURL ? { uri: rep.photoURL } : Images.DEFAULT_USER_PICTURE}
                                            />
                                            <View className='flex-col'>
                                                <Text
                                                    className={`font-medium text-lg ${name!.toLowerCase() === "shpetinas" ? "text-pink-500" : darkMode ? 'text-grey-light' : 'text-grey-dark'
                                                        }`}
                                                >
                                                    Representative
                                                </Text>

                                                <Text className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
                                                    {rep?.name}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}

                                    {localTeamMembers.leads.map((lead, index) => (
                                        <View key={index} className='flex-row items-center mt-7'>
                                            <Image
                                                className="flex w-12 h-12 rounded-full mr-2"
                                                defaultSource={Images.DEFAULT_USER_PICTURE}
                                                source={lead?.photoURL ? { uri: lead.photoURL } : Images.DEFAULT_USER_PICTURE}
                                            />
                                            <View className='flex-col'>
                                                <Text
                                                    className={`font-medium text-lg ${name!.toLowerCase() === "shpetinas" ? "text-pink-500" : darkMode ? 'text-grey-light' : 'text-grey-dark'
                                                        }`}
                                                >
                                                    Lead
                                                </Text>
                                                <Text className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
                                                    {lead?.name}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View className='pb-52' />
            </ScrollView>

            {/* Action Button */}
            {!isInCommittee && (

                <SafeAreaView edges={['bottom']} className='w-full absolute bottom-0 mb-14'>
                    <TouchableOpacity
                        className={`py-1 rounded-xl mx-4 h-14 items-center justify-center ${isLeaveOrCancel ? (darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light') : 'bg-primary-blue'} border ${isLeaveOrCancel ? 'border-grey-dark' : 'border-transparent'}`}
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
                        onPress={handleJoinLeave}
                    >
                        {loadingLabel ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <Text className={`text-center ${isLeaveOrCancel ? `${darkMode ? "text-white" : "text-black"}` : 'text-white'} text-2xl font-bold`}>{buttonLabel}</Text>
                        )}
                    </TouchableOpacity>
                </SafeAreaView>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={membersListVisible}
                onRequestClose={() => {
                    setMembersListVisible(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? 'text-white' : 'text-black'}`}>Select a Member</Text>
                        </View>

                        <TouchableOpacity
                            className='ml-6 px-4'
                            onPress={() => setMembersListVisible(false)}
                        >
                            <Octicons name="x" size={26} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {loadingMembers && (
                        <ActivityIndicator className="mb-2" size="small" />
                    )}

                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        <MembersList
                            key={forceUpdate}
                            navigation={navigation}
                            handleCardPress={() => { setMembersListVisible(false) }}
                            users={members}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

interface TeamMembersState {
    leads: (PublicUserInfo | undefined)[];
    representatives: (PublicUserInfo | undefined)[];
    head: PublicUserInfo | null | undefined;
}

type CommitteeInfoScreenRouteProps = {
    route: RouteProp<CommitteesStackParams, 'CommitteeInfo'>;
    navigation: NativeStackNavigationProp<CommitteesStackParams, 'CommitteeInfo'>;
};

export default CommitteeInfo