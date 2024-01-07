import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { getCommitteeEvents, getUpcomingEvents } from '../../api/firebaseUtils';
import { Timestamp } from 'firebase/firestore';
import { SHPEEvent } from '../../types/Events';
import { Committee, getLogoComponent } from '../../types/Committees';
import { Images } from '../../../assets';
import EventsList from '../../components/EventsList';

const Ishpe = () => {
    const { userInfo } = useContext(UserContext)!;
    const userCommittees = userInfo?.publicInfo?.committees || [];
    const [ishpeEvents, setIshpeEvents] = useState<SHPEEventWithCommitteeData[]>([]);
    const [generalEvents, setGeneralEvents] = useState<SHPEEvent[]>([]);
    const [currentTab, setCurrentTab] = useState<string>("ISHPE")
    const [weekStartDate, setWeekStartDate] = useState(getCurrentSunday()); // Initialize with current week
    const [loadingIshpeEvents, setLoadingIshpeEvents] = useState(true);
    const [loadingGeneralEvents, setLoadingGeneralEvents] = useState(true);

    const forwardButtonDisabled = (weekStartDate.toISOString().split('T')[0] == getCurrentSunday().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoadingIshpeEvents(true);
                setLoadingGeneralEvents(true);

                // Fetch ishpeEvents
                const ishpeResponse = await getCommitteeEvents(userCommittees) as SHPEEventWithCommitteeData[];
                setIshpeEvents(ishpeResponse);

                // Fetch generalEvents and filter out ishpeEvents
                const generalResponse = await getUpcomingEvents();
                const filteredGeneralEvents = generalResponse.filter(generalEvent =>
                    !ishpeResponse.some(ishpeEvent => ishpeEvent.id === generalEvent.id)
                );
                setGeneralEvents(filteredGeneralEvents);

            } catch (error) {
                console.error("Error retrieving events:", error);
            } finally {
                setLoadingIshpeEvents(false);
                setLoadingGeneralEvents(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <View className="mx-4 bg-gray-100 rounded-md flex-col mt-4">
            {/* Tabs */}
            <View className="flex-row bg-gray-200 rounded-md px-2 pt-3">
                <TouchableOpacity
                    className="flex-1 justify-center items-center"
                    onPress={() => setCurrentTab('ISHPE')}>
                    <Text className="font-bold text-center text-lg">I.SHPE</Text>
                    <View className={`pt-3 w-1/2 border-b-2 ${currentTab == "ISHPE" ? "border-pale-blue" : "border-transparent"} `} />
                </TouchableOpacity>

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