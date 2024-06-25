import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme, Image, Modal } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { Octicons, Entypo } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../context/UserContext';
import { getCommitteeEvents, getPublicUserData, setPublicUserData } from '../../api/firebaseUtils';
import { handleLinkPress } from '../../helpers/links';
import { getLogoComponent } from '../../types/committees';
import { SHPEEvent } from '../../types/events';
import { PublicUserInfo } from '../../types/user';
import { auth, db } from '../../config/firebaseConfig';
import MembersList from '../../components/MembersList';
import { RouteProp } from '@react-navigation/core';
import { CommitteesStackParams } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Images } from '../../../assets';
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

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());


    const [events, setEvents] = useState<SHPEEvent[]>([]);
    const [localTeamMemberOnlyCount, setLocalTeamMemberOnlyCount] = useState<number>(memberCount || 0);
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [membersListVisible, setMembersListVisible] = useState<boolean>(false);
    const [isInCommittee, setIsInCommittee] = useState<boolean>();
    const [isRequesting, setIsRequesting] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [loadingEvent, setEventLoading] = useState<boolean>(true);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
    const [loadingLabel, setLoadingLabel] = useState<boolean>(true);

    const [localTeamMembers, setLocalTeamMembers] = useState<TeamMembersState>({
        leads: [],
        representatives: [],
        head: null,
    });

    useEffect(() => {
        const fetchEvents = async () => {
            setEventLoading(true);
            const response = await getCommitteeEvents([firebaseDocName!]);
            setEvents(response);
            setEventLoading(false);
        }

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
            }
        };

        const checkStatus = async () => {
            setLoadingLabel(true);

            const committeeExists = userInfo?.publicInfo?.committees?.includes(firebaseDocName!);
            if (auth.currentUser && !committeeExists && !isOpen) {
                const requestRef = doc(db, `committeeVerification/${firebaseDocName}/requests/${auth.currentUser.uid}`);
                const requestSnapshot = await getDoc(requestRef);
                setIsRequesting(requestSnapshot.exists());
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

    useEffect(() => {
        const fetchLocalMemberOnlyCount = () => {
            const { leads, representatives, head } = localTeamMembers;
            let totalTeamMemberCount = 0;

            if (head) {
                totalTeamMemberCount += 1;
            }

            totalTeamMemberCount += leads.length;
            totalTeamMemberCount += representatives.length;

            if ((memberCount || 0) - totalTeamMemberCount < 0) {
                setLocalTeamMemberOnlyCount(0);
            } else {
                setLocalTeamMemberOnlyCount((memberCount || 0) - totalTeamMemberCount);
            }
        };

        fetchLocalMemberOnlyCount();
    }, [localTeamMembers])

    const fetchCommitteeMembers = async (committeeFirebaseDocName: string) => {
        // Force update only happens once
        if (forceUpdate == 1) {
            return;
        }
        setLoadingMembers(true);

        const allUsersSnapshot = await await getDocs(collection(db, 'users'));
        const committeeMembers: PublicUserInfo[] = [];

        for (const userDoc of allUsersSnapshot.docs) {
            const userData = userDoc.data();
            if (userData.committees && userData.committees.includes(committeeFirebaseDocName)) {
                committeeMembers.push({ ...userData, uid: userDoc.id });
            }
        }

        setMembers(committeeMembers);
        setLoadingMembers(false);
        setForceUpdate(1);
    };

    const submitCommitteeRequest = useCallback(async () => {
        if (auth.currentUser) {
            await setDoc(doc(db, `committeeVerification/${firebaseDocName}/requests/${auth.currentUser.uid}`), {
                uploadDate: new Date().toISOString(),
            }, { merge: true });
        }
    }, [firebaseDocName]);

    const removeCommitteeRequest = useCallback(async () => {
        if (auth.currentUser) {
            const requestDocRef = doc(db, `committeeVerification/${firebaseDocName}/requests/${auth.currentUser.uid}`);
            await deleteDoc(requestDocRef);
        }
    }, [firebaseDocName]);

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
        await submitCommitteeRequest();
        setIsRequesting(true);
    };

    const cancelRequest = async () => {
        await removeCommitteeRequest();
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
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
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

                {/* Logo */}
                <View className='items-center justify-center mt-4'>
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
                </View>

                <View className='mx-4'>
                    {/* General Details */}
                    <View className='mt-7'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{memberCount} members • {isOpen ? "Open" : "Private"}</Text>
                        <View className='flex-row flex-wrap'>
                            {localTeamMembers.head && (
                                <Image
                                    className="flex w-9 h-9 rounded-full mr-2"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={localTeamMembers.head.photoURL ? { uri: localTeamMembers.head.photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            )}

                            {localTeamMembers.representatives.map((rep, index) => (
                                <Image
                                    key={index}
                                    className="flex w-9 h-9 rounded-full mr-2"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={rep?.photoURL ? { uri: rep.photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            ))}

                            {localTeamMembers.leads.map((lead, index) => (
                                <Image
                                    key={index}
                                    className="flex w-9 h-9 rounded-full mr-2"
                                    defaultSource={Images.DEFAULT_USER_PICTURE}
                                    source={lead?.photoURL ? { uri: lead.photoURL } : Images.DEFAULT_USER_PICTURE}
                                />
                            ))}

                            <TouchableOpacity
                                className='bg-primary-blue w-9 h-9 rounded-full items-center justify-center'
                                onPress={() => {
                                    setMembersListVisible(true);
                                    fetchCommitteeMembers(firebaseDocName!);
                                }}
                            >
                                <Text className='text-white text-lg'>+{localTeamMemberOnlyCount}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* About */}
                    <View className='mt-10'>
                        <View className='mb-2'>
                            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>About the committee</Text>
                            {applicationLink && (
                                <TouchableOpacity
                                    onPress={() => handleLinkPress(applicationLink)}
                                >
                                    <Text className={`text-lg text-primary-blue underline`}>View Applications</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View
                            className={`px-3 py-2 rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(description || "", 170)}</Text>
                        </View>
                    </View>

                    {/* Upcoming Events */}
                    <View className='mt-10'>
                        <Text className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`}>Upcoming Events</Text>

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
                                <ActivityIndicator className="mb-2" size="small" />
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
                </View>

                <View className='pb-40' />
            </ScrollView>

            {/* Action Button */}
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

const truncateStringWithEllipsis = (name: string, limit = 22) => {
    if (name.length > limit) {
        return `${name.substring(0, limit)}...`;
    }
    return name;
};


export default CommitteeInfo