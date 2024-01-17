import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { db, functions } from '../../config/firebaseConfig';
import { getCommitteeEvents, setPublicUserData } from '../../api/firebaseUtils';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { calculateHexLuminosity } from '../../helpers/colorUtils';
import { handleLinkPress } from '../../helpers/links';
import { CommitteeScreenProps } from '../../types/Navigation';
import { getLogoComponent } from '../../types/Committees';
import { SHPEEvent } from '../../types/Events';
import CommitteeTeamCard from './CommitteeTeamCard';
import DismissibleModal from '../../components/DismissibleModal';
import EventsList from '../../components/EventsList';

const Committee: React.FC<CommitteeScreenProps> = ({ route, navigation }) => {
    const initialCommittee = route.params.committee;

    const { name, color, logo, head, leads, representatives, description, memberApplicationLink, leadApplicationLink, firebaseDocName } = initialCommittee;
    const [memberCount, setMemberCount] = useState<number>(initialCommittee.memberCount || 0);
    const [events, setEvents] = useState<SHPEEvent[]>([]);
    const { LogoComponent, height, width } = getLogoComponent(logo);
    const luminosity = calculateHexLuminosity(color!);
    const isLightColor = luminosity < 155;

    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [isInCommittee, setIsInCommittee] = useState<boolean>();
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingCountChange, setLoadingCountChange] = useState<boolean>(false);


    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const response = await getCommitteeEvents([firebaseDocName!]);
            setEvents(response);
            setLoading(false);
        }
        fetchEvents();
    }, [])

    useEffect(() => {
        const committeeExists = userInfo?.publicInfo?.committees?.includes(firebaseDocName!);
        setIsInCommittee(committeeExists);
    }, [userInfo]);

    return (
        <View className='flex-1' style={{ backgroundColor: color }} >
            <StatusBar style={isLightColor ? "light" : "dark"} />
            {/* Header */}
            <SafeAreaView edges={['top']} >
                <View className='flex-row items-center mx-5 mt-1'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-2xl font-semibold text-${isLightColor ? "white" : "black"}`} >{name}</Text>
                        <View className='absolute top-full'>
                            <Text className={`text-lg font-semibold text-${isLightColor ? "white" : "black"}`} >{memberCount} Members</Text>
                        </View>
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
                            <LogoComponent width={height} height={width} />
                        </View>
                        <TouchableOpacity
                            className={`px-4 py-[2px] rounded-lg items-center mt-2 mx-2 ${isInCommittee ? "bg-[#FF4545]" : "bg-[#AEF359]"}`}
                            onPress={() => setConfirmVisible(!confirmVisible)}
                        >
                            {loadingCountChange ? (
                                <ActivityIndicator color="#000000" />
                            ) : (
                                <Text className='text-lg font-semibold'>{isInCommittee ? "Leave" : "Join"}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Name and Application Buttons */}
                    <View className='flex-col flex-1 py-2 ml-6'>
                        <View className='flex-row mb-4 w-full justify-center'>
                            <Text className="text-xl font-semibold">{name}</Text>
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
                            <CommitteeTeamCard userData={head!} navigation={navigation} />
                        </View>
                        {representatives && representatives.length > 0 && (
                            <>
                                <Text className='font-bold text-lg mb-2' style={{ color: color }}>Representatives</Text>
                                {representatives.map((representative, index) => (
                                    <View className='mb-6' key={index}>
                                        <CommitteeTeamCard userData={representative} navigation={navigation} />
                                    </View>
                                ))}
                            </>
                        )}
                        {leads && leads.length > 0 && (
                            <>
                                <Text className='font-bold text-lg mb-2' style={{ color: color }}>Leads</Text>
                                {leads.map((representative, index) => (
                                    <View className='mb-6' key={index}>
                                        <CommitteeTeamCard userData={representative} navigation={navigation} />
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                </View>

                <View className='mb-28' />
            </ScrollView >

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
                                    setLoadingCountChange(true);
                                    const fetchCommitteeData = async () => {
                                        try {
                                            const docRef = doc(db, `committees/${initialCommittee.firebaseDocName}`);
                                            const docSnapshot = await getDoc(docRef);
                                            if (docSnapshot.exists()) {
                                                setMemberCount(docSnapshot.data().memberCount);
                                            }
                                        } catch (error) {
                                            console.error('Error fetching updated committee data:', error);
                                        }
                                    };

                                    const committeeChanges = [{
                                        committeeName: firebaseDocName,
                                        change: isInCommittee ? -1 : 1
                                    }];
                                    const updateCommitteeMembersCount = httpsCallable(functions, 'updateCommitteeMembersCount');
                                    let updatedCommittees = [...userInfo?.publicInfo?.committees || []];
                                    if (isInCommittee) {
                                        updatedCommittees = updatedCommittees.filter(c => c !== firebaseDocName);
                                    } else {
                                        updatedCommittees.push(firebaseDocName!);
                                    }

                                    try {
                                        await setPublicUserData({ committees: updatedCommittees });
                                        await updateCommitteeMembersCount({ committeeChanges });
                                        await fetchCommitteeData();

                                        setUserInfo({
                                            ...userInfo,
                                            publicInfo: {
                                                ...userInfo?.publicInfo,
                                                committees: updatedCommittees
                                            }
                                        });
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
                                        setLoadingCountChange(false);
                                    }
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

export default Committee