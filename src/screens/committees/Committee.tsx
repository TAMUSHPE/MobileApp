import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../context/UserContext';
import { getCommitteeEvents, getPublicUserData, setPublicUserData } from '../../api/firebaseUtils';
import { calculateHexLuminosity } from '../../helpers/colorUtils';
import { handleLinkPress } from '../../helpers/links';
import { getLogoComponent } from '../../types/committees';
import { SHPEEvent } from '../../types/events';
import { PublicUserInfo } from '../../types/user';
import DismissibleModal from '../../components/DismissibleModal';
import { auth, db } from '../../config/firebaseConfig';
import EventsList from '../../components/EventsList';
import MembersList from '../../components/MembersList';
import CommitteeTeamCard from './CommitteeTeamCard';
import { RouteProp } from '@react-navigation/core';
import { CommitteesStackParams } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


const Committee: React.FC<CommitteeScreenRouteProps> = ({ route, navigation }) => {
    const initialCommittee = route.params.committee;

    const { name, color, logo, description, memberApplicationLink, representativeApplicationLink, leadApplicationLink, firebaseDocName, isOpen, memberCount } = initialCommittee;
    const [events, setEvents] = useState<SHPEEvent[]>([]);
    const { LogoComponent, height, width } = getLogoComponent(logo);
    const luminosity = calculateHexLuminosity(color!);
    const isLightColor = luminosity < 155;

    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [isInCommittee, setIsInCommittee] = useState<boolean>();
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
    const [loadingCountChange, setLoadingCountChange] = useState<boolean>(false)
    const [isRequesting, setIsRequesting] = useState(false);
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [membersListVisible, setMembersListVisible] = useState<boolean>(false);
    const insets = useSafeAreaInsets();

    const [localTeamMembers, setLocalTeamMembers] = useState<TeamMembersState>({
        leads: [],
        representatives: [],
        head: null,
    });

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const response = await getCommitteeEvents([firebaseDocName!]);
            setEvents(response);
            setLoading(false);
        }

        const fetchUserData = async () => {
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

        fetchEvents();
        fetchUserData();
    }, [])

    useEffect(() => {
        const committeeExists = userInfo?.publicInfo?.committees?.includes(firebaseDocName!);
        setIsInCommittee(committeeExists);
    }, [userInfo]);

    useEffect(() => {
        const checkRequestStatus = async () => {
            if (auth.currentUser && !isInCommittee) {
                const requestRef = doc(db, `committeeVerification/${firebaseDocName}/requests/${auth.currentUser.uid}`);
                const requestSnapshot = await getDoc(requestRef);
                setIsRequesting(requestSnapshot.exists());
            }
        };

        checkRequestStatus();
    }, [auth.currentUser, isInCommittee, firebaseDocName, db]);

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
    }, [userInfo]);

    const removeCommitteeRequest = useCallback(async () => {
        if (auth.currentUser) {
            const requestDocRef = doc(db, `committeeVerification/${firebaseDocName}/requests/${auth.currentUser.uid}`);
            await deleteDoc(requestDocRef);
        }
    }, [userInfo]);

    const handleJoinLeave = async () => {
        setLoadingCountChange(true);
        if (isInCommittee) {
            let updatedCommittees = [...userInfo?.publicInfo?.committees || []];
            updatedCommittees = updatedCommittees.filter(c => c !== firebaseDocName);

            try {
                await setPublicUserData({ committees: updatedCommittees });

                const updatedUserInfo = {
                    ...userInfo,
                    publicInfo: {
                        ...userInfo?.publicInfo,
                        committees: updatedCommittees
                    }
                };

                try {
                    await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                    setUserInfo(updatedUserInfo);
                } catch (error) {
                    console.error("Error updating user info:", error);
                }

            } catch (err) {
                console.error(err);
            }
        } else {
            if (isOpen) {
                let updatedCommittees = [...userInfo?.publicInfo?.committees || []];
                updatedCommittees.push(firebaseDocName!);

                try {
                    await setPublicUserData({ committees: updatedCommittees });

                    const updatedUserInfo = {
                        ...userInfo,
                        publicInfo: {
                            ...userInfo?.publicInfo,
                            committees: updatedCommittees
                        }
                    };

                    try {
                        await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                        setUserInfo(updatedUserInfo);
                    } catch (error) {
                        console.error("Error updating user info:", error);
                    }

                } catch (err) {
                    console.error(err);
                }
            } else {
                submitCommitteeRequest();
                setIsRequesting(true);
            }
        }
        setLoadingCountChange(false);
    }

    return (
        <View className='flex-1' style={{ backgroundColor: color }} >
            <StatusBar style={isLightColor ? "light" : "dark"} />
            {/* Header */}
            <SafeAreaView edges={['top']} >
                <View className='flex-row items-center mx-5 mt-1'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-2xl font-semibold text-${isLightColor ? "white" : "black"}`} >{name}</Text>
                        <TouchableOpacity
                            className='absolute top-full px-2 py-1 rounded-md'
                            style={{
                                backgroundColor: isLightColor ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                            }}
                            onPress={() => {
                                setMembersListVisible(true);
                                fetchCommitteeMembers(firebaseDocName!);
                            }}
                        >
                            <Text className={`text-lg font-semibold text-${isLightColor ? "white" : "black"}`} >{memberCount} Members</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color={isLightColor ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Content */}
            <ScrollView
                scrollEventThrottle={400}
                bounces={false}
                className='bg-[#F9F9F9] mt-12 rounded-t-2xl py-8 px-5'
            >
                <View className='flex-row w-full h-32'>
                    {/* Logo and Join/Leave Button */}
                    <View className='rounded-2xl flex-col' style={{ backgroundColor: color }} >
                        <View className='items-center justify-center h-full rounded-2xl px-3' style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
                            <LogoComponent width={height} height={width} style={{ minWidth: 70 }} />
                        </View>
                        <TouchableOpacity
                            className={`px-4 py-[2px] rounded-lg items-center mt-2 mx-2 ${isInCommittee ? "bg-[#FF4545]" : isRequesting ? "bg-gray-400" : "bg-[#AEF359]"}`}
                            onPress={() => {
                                if (!userInfo?.publicInfo?.isStudent) {
                                    alert("You must be a student to join a committee.")
                                    return;
                                }

                                if (isRequesting) {
                                    removeCommitteeRequest();
                                    setIsRequesting(false)
                                } else {
                                    // Join or Leave confirmation
                                    setConfirmVisible(!confirmVisible)
                                }
                            }}
                            disabled={loadingCountChange}
                        >

                            {loadingCountChange ? (
                                <ActivityIndicator color="#000000" />
                            ) : (
                                <Text className='text-lg font-semibold'>
                                    {isInCommittee ? "Leave" : isRequesting ? "Cancel\nRequest" : "Join"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Name and Application Buttons */}
                    <View className='flex-col flex-1 py-2 ml-6'>
                        <View className='flex-row mb-4 w-full justify-center items-center'>
                            <Text className="text-xl font-semibold">{name}</Text>
                            <Text className="text-md font-semibold"> {isOpen ? "(Open)" : "(Closed)"}</Text>
                        </View>
                        <View className='flex-col items-center'>
                            {memberApplicationLink && (
                                <TouchableOpacity
                                    className='py-2 rounded-lg items-center w-[80%]'
                                    style={{ backgroundColor: color }}
                                    onPress={() => handleLinkPress(memberApplicationLink!)}
                                >
                                    <Text className={`font-semibold text-${isLightColor ? "white" : "black"}`}>Member Application</Text>
                                </TouchableOpacity>
                            )}
                            {representativeApplicationLink && (

                                <TouchableOpacity
                                    className='py-2 rounded-lg items-center mt-2 w-[80%]'
                                    style={{ backgroundColor: color }}
                                    onPress={() => handleLinkPress(representativeApplicationLink!)}
                                >
                                    <Text className={`font-semibold text-${isLightColor ? "white" : "black"}`}>Representative Application</Text>
                                </TouchableOpacity>
                            )}
                            {leadApplicationLink && (

                                <TouchableOpacity
                                    className='py-2 rounded-lg items-center mt-2 w-[80%]'
                                    style={{ backgroundColor: color }}
                                    onPress={() => handleLinkPress(leadApplicationLink!)}
                                >
                                    <Text className={`font-semibold text-${isLightColor ? "white" : "black"}`}>Lead Application</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* About */}
                <View className='mt-14'>
                    <Text className='text-2xl font-bold'>About</Text>
                    <Text className='text-lg font-semibold'>{description}</Text>
                </View>

                {/* Upcoming Events */}
                <View className='mt-11'>
                    <Text className='text-2xl font-bold mb-2'>Upcoming Events</Text>
                    <EventsList events={events} isLoading={loading} showImage={false} navigation={navigation} />
                </View>

                {/* Team List */}
                <View className='mt-11'>
                    <Text className='text-2xl font-bold mb-1'>Meet the Team</Text>
                    <View className='px-3 pt-5 bg-white rounded-lg shadow-sm shadow-slate-300'>
                        <View className='mb-6'>
                            <Text className='font-bold text-lg mb-2' style={{ color: color }}>Head</Text>
                            <CommitteeTeamCard userData={localTeamMembers.head || {}} navigation={navigation} />
                        </View>
                        {localTeamMembers.representatives && localTeamMembers.representatives.length > 0 && (
                            <>
                                <Text className='font-bold text-lg mb-2' style={{ color: color }}>Representatives</Text>
                                {localTeamMembers.representatives.map((representative, index) => (
                                    <View className='mb-6' key={index}>
                                        <CommitteeTeamCard userData={representative || {}} navigation={navigation} />
                                    </View>
                                ))}
                            </>
                        )}
                        {localTeamMembers.leads && localTeamMembers.leads.length > 0 && (
                            <>
                                <Text className='font-bold text-lg mb-2' style={{ color: color }}>Leads</Text>
                                {localTeamMembers.leads.map((lead, index) => (
                                    <View className='mb-6' key={index}>
                                        <CommitteeTeamCard userData={lead || {}} navigation={navigation} />
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                </View>

                <View className='mb-28' />
            </ScrollView>

            <DismissibleModal
                visible={membersListVisible}
                setVisible={setMembersListVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md space-y-6 h-screen w-screen'>
                    <View
                        className='flex-row items-center justify-between mx-5 mt-6'
                        style={{ paddingTop: insets.top }}
                    >
                        <View className='flex-row items-center'>
                            <Text className='text-3xl font-semibold ml-4'>{name}</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => {
                                setMembersListVisible(false);
                            }}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {loadingMembers && (
                        <View>
                            <ActivityIndicator className='mt-4' size={"large"} />
                        </View>
                    )}

                    <View className='mt-9 flex-1'>
                        <MembersList
                            key={forceUpdate}
                            handleCardPress={(uid) => {
                                navigation.navigate('PublicProfile', { uid })
                                setMembersListVisible(false);
                            }}
                            users={members}
                        />
                    </View>

                </View>
            </DismissibleModal>


            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'>
                    <Octicons name="person" size={24} color="black" />
                    <View className='flex items-center w-[80%] space-y-8'>
                        <Text className="text-center text-lg font-bold"> {isInCommittee ? "Are you sure you want leave?" : "Are you sure you want to join?"}</Text>
                        <View className="flex-row">
                            <TouchableOpacity
                                className="bg-pale-blue rounded-xl justify-center items-center"
                                onPress={async () => {
                                    setConfirmVisible(false);
                                    handleJoinLeave();
                                }}
                            >
                                <Text className='text-xl font-bold text-white px-8'>{isInCommittee ? "Leave" : "Join"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={async () => { setConfirmVisible(false) }} >
                                <Text className='text-xl font-bold py-3 px-8'> Cancel </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </DismissibleModal>
        </View >
    )
}

interface TeamMembersState {
    leads: (PublicUserInfo | undefined)[];
    representatives: (PublicUserInfo | undefined)[];
    head: PublicUserInfo | null | undefined;
}

type CommitteeScreenRouteProps = {
    route: RouteProp<CommitteesStackParams, 'CommitteeScreen'>;
    navigation: NativeStackNavigationProp<CommitteesStackParams, 'CommitteeScreen'>;
};

export default Committee