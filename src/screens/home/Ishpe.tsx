import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../context/UserContext';
import { getCommitteeEvents, getCommittees, getInterestsEvent, getUpcomingEvents, setPublicUserData } from '../../api/firebaseUtils';
import { EventType, SHPEEvent } from '../../types/Events';
import { Committee } from '../../types/Committees';
import SHPELogo from '../../../assets/SHPE_black.svg';
import EventsList from '../../components/EventsList';
import DismissibleModal from '../../components/DismissibleModal';
import ProfileBadge from '../../components/ProfileBadge';

const Ishpe = () => {
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const userCommittees = userInfo?.publicInfo?.committees || [];
    const [userInterests, setUserInterests] = useState<string[]>(userInfo?.publicInfo?.interests || []);
    const [ishpeEvents, setIshpeEvents] = useState<SHPEEventWithCommitteeData[]>([]);
    const [generalEvents, setGeneralEvents] = useState<SHPEEvent[]>([]);
    const [committeesData, setCommitteesData] = useState<Committee[]>([]);
    const [currentTab, setCurrentTab] = useState<string>("ISHPE")
    const [weekStartDate, setWeekStartDate] = useState(getCurrentSunday()); // Initialize with current week
    const [loadingIshpeEvents, setLoadingIshpeEvents] = useState(true);
    const [loadingGeneralEvents, setLoadingGeneralEvents] = useState(true);
    const [interestOptionsModal, setInterestOptionsModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const forwardButtonDisabled = (weekStartDate.toISOString().split('T')[0] == getCurrentSunday().toISOString().split('T')[0]);

    const fetchEvents = async () => {
        try {
            setLoadingIshpeEvents(true);
            setLoadingGeneralEvents(true);

            // Fetch ishpeEvents (committee events) and interestEvents
            const [ishpeResponse, interestResponse] = await Promise.all([
                getCommitteeEvents(userCommittees) as Promise<SHPEEventWithCommitteeData[]>,
                getInterestsEvent(userInterests) as Promise<SHPEEventWithCommitteeData[]>
            ]);

            // Merge and sort events by start date in ascending order
            const mergedEvents = [...ishpeResponse, ...interestResponse];
            mergedEvents.sort((a, b) => (a.startTime?.toDate().getTime() || 0) - (b.startTime?.toDate().getTime() || 0));

            setIshpeEvents(mergedEvents);

            // Fetch generalEvents and filter out ishpeEvents and interestEvents
            const generalResponse = await getUpcomingEvents();
            const filteredGeneralEvents = generalResponse.filter(generalEvent =>
                !mergedEvents.some(event => event.id === generalEvent.id)
            );
            setGeneralEvents(filteredGeneralEvents);

        } catch (error) {
            console.error("Error retrieving events:", error);
        } finally {
            setLoadingIshpeEvents(false);
            setLoadingGeneralEvents(false);
        }
    };

    useEffect(() => {
        const fetchCommittees = async () => {
            const response = await getCommittees();
            setCommitteesData(response);
        }

        fetchEvents();
        fetchCommittees();
    }, []);

    useEffect(() => {
        if (interestOptionsModal) {
            setUserInterests(userInfo?.publicInfo?.interests || []);
        }
    }, [interestOptionsModal])

    const isInterestChanged = () => {
        if (!userInfo?.publicInfo?.interests) {
            return userInterests.length > 0;
        }

        const originalInterests = new Set(userInfo.publicInfo.interests);
        const currentInterests = new Set(userInterests);

        if (originalInterests.size !== currentInterests.size) {
            return true;
        }

        for (let interest of originalInterests) {
            if (!currentInterests.has(interest)) {
                return true;
            }
        }

        return false;
    };

    const handleInterestToggle = (name: string) => {
        setUserInterests(prevInterest => {
            const isCommitteeSelected = prevInterest.includes(name);
            if (isCommitteeSelected) {
                return prevInterest.filter(interest => interest !== name);
            } else {
                return [...prevInterest, name];
            }
        });
    };

    const InterestButtons = ({ interestEvent, label, color }: {
        interestEvent: EventType;
        label: string;
        color: string;
    }) => {
        const isSelected = userInterests.includes(interestEvent);
        return (
            <TouchableOpacity
                onPress={() => handleInterestToggle(interestEvent)}
                className='rounded-md border-2 mr-5 px-2 py-1 mt-5'
                style={{ borderColor: isSelected ? "#72A9BE" : "black" }}
            >
                <Text className={`font-semibold text-lg ${isSelected && "text-pale-blue"}`}>{label}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View className="mx-4 bg-gray-100 rounded-md flex-col mt-4">
            {/* Tabs */}
            <View className="flex-row bg-gray-200 rounded-md px-2 pt-3">
                <View className='relative flex-1 justify-center'>
                    <TouchableOpacity
                        className="justify-center items-center"
                        onPress={() => setCurrentTab('ISHPE')}>
                        <Text className="font-bold text-center text-lg">I.SHPE</Text>
                        <View className={`pt-3 w-1/2 border-b-2 ${currentTab == "ISHPE" ? "border-pale-blue" : "border-transparent"} `} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='absolute top-0'
                        onPress={() => setInterestOptionsModal(true)}
                    >
                        <Octicons name="gear" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className="flex-1 justify-center items-center"
                    onPress={() => setCurrentTab('General')}>
                    <Text className="font-bold text-center text-lg">General</Text>
                    <View className={`pt-3 w-1/2 border-b-2 ${currentTab == "General" ? "border-pale-blue" : "border-transparent"} `} />
                </TouchableOpacity>
            </View>

            {/* Date Control */}
            <View className="flex-row justify-end p-3">
                <TouchableOpacity onPress={() => setWeekStartDate(adjustWeekRange(weekStartDate, 'backwards'))}>
                    <Octicons name="chevron-left" size={25} color="black" />
                </TouchableOpacity>

                <Text className="pt-1 px-1"> {formatWeekRange(weekStartDate)} </Text>

                <TouchableOpacity
                    onPress={() => setWeekStartDate(adjustWeekRange(weekStartDate, 'forwards'))}
                    disabled={forwardButtonDisabled}
                    className={`${forwardButtonDisabled ? 'opacity-30' : 'opacity-100'}`}>
                    <Octicons name="chevron-right" size={25} color="black" />
                </TouchableOpacity>
            </View>

            {/* Event List */}
            {currentTab === 'ISHPE' && <EventsList events={ishpeEvents} isLoading={loadingIshpeEvents} />}
            {currentTab === 'General' && <EventsList events={generalEvents} isLoading={loadingGeneralEvents} />}

            <View className='pb-8' />

            <DismissibleModal
                visible={interestOptionsModal}
                setVisible={setInterestOptionsModal}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 w-full' style={{ minWidth: 355 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <SHPELogo width={40} height={40} />
                            <Text className='text-2xl font-semibold ml-3'>I.SHPE</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => {
                                setInterestOptionsModal(false)
                                setUserInterests(userInfo?.publicInfo?.interests || [])
                            }}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='mt-4'>
                        <Text className='text-2xl font-bold'>Interest</Text>
                        <Text className='text-lg text-gray-600'>Select the type of events you are interested in</Text>

                        {/* If any additional interest are added in the future, then update manually in profile setup */}
                        <View className='flex-row flex-wrap'>
                            <InterestButtons interestEvent={EventType.VOLUNTEER_EVENT} label="Volunteering" color={"#E93535"} />
                            <InterestButtons interestEvent={EventType.INTRAMURAL_EVENT} label="Intramural" color={"#000000"} />
                            <InterestButtons interestEvent={EventType.SOCIAL_EVENT} label="Socials" color={"#A75EF8"} />
                            <InterestButtons interestEvent={EventType.STUDY_HOURS} label="Study Hours" color={"#9DB89A"} />
                            <InterestButtons interestEvent={EventType.WORKSHOP} label="Workshops" color={"#FF910A"} />
                        </View>

                        {/* Save Changes Button */}
                        <View style={{ minHeight: 60 }}>
                            {(isInterestChanged() && !loading) && (
                                <TouchableOpacity
                                    className='w-full mt-4'
                                    onPress={async () => {
                                        setLoading(true);
                                        await fetchEvents();
                                        await setPublicUserData({
                                            interests: userInterests,
                                        });

                                        // locally update user info
                                        if (userInfo) {
                                            const updatedUserInfo = {
                                                ...userInfo,
                                                publicInfo: {
                                                    ...userInfo.publicInfo,
                                                    interests: userInterests,
                                                },
                                            };

                                            try {
                                                await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                                                setUserInfo(updatedUserInfo);
                                            } catch (error) {
                                                console.error("Error updating user info:", error);
                                            }
                                        }

                                        setLoading(false);
                                    }}
                                >
                                    <View className='items-center justify-center bg-pale-blue w-1/2 rounded-md px-2 py-2'>
                                        <Text className='text-white font-bold text-xl'>Save Changes</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            {loading && (
                                <ActivityIndicator size="large" className='mt-4' />
                            )}
                        </View>
                    </View>

                    {/* User Committees */}
                    <View className='mt-4'>
                        <Text className='text-2xl font-bold'>Your Committees</Text>
                        <Text className="text-lg text-gray-600">Visit committees tab to join or leave a committee</Text>
                        {userCommittees && userCommittees.length > 0 && (
                            <View className='mt-2'>
                                <View className='flex-row flex-wrap mt-2'>
                                    {userCommittees?.map((committeeName, index) => {
                                        const committeeData = committeesData.find(c => c.firebaseDocName === committeeName);
                                        return (
                                            <ProfileBadge
                                                badgeClassName='p-2 max-w-2/5 rounded-md mr-1 mb-2'
                                                textClassName='text-lg'
                                                text={committeeData?.name || "Unknown Committee"}
                                                badgeColor={committeeData?.color || ""}
                                                key={index}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </DismissibleModal>
        </View>
    );
};

const getCurrentSunday = () => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    return currentDate;
}

const adjustWeekRange = (currentStartDate: Date, direction: string) => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // milliseconds in one week
    let newStartDate = new Date(currentStartDate.getTime() + (direction === 'forwards' ? oneWeek : -oneWeek));
    return newStartDate;
}

const formatWeekRange = (startDate: Date) => {
    let endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const format = (date: Date) => `${date.getMonth() + 1}/${date.getDate().toString().padStart(2, '0')}`;
    return `${format(startDate)} - ${format(endDate)}`;
}

type SHPEEventWithCommitteeData = SHPEEvent & { committeeData?: Committee };

export default Ishpe;