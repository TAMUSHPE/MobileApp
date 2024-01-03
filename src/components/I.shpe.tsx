import { View, Text, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Octicons } from '@expo/vector-icons';
import {fetchEventsForCommittees } from '../api/firebaseUtils';
import { Images } from '../../assets'

function getCurrentSunday() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    return currentDate;
}

function adjustWeekRange(currentStartDate:Date, direction:string) {
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // milliseconds in one week
    let newStartDate = new Date(currentStartDate.getTime() + (direction === 'forwards' ? oneWeek : -oneWeek));
    return newStartDate;
}

function formatWeekRange(startDate:Date) {
    let endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const format = (date:Date) => `${date.getMonth() + 1}/${date.getDate().toString().padStart(2, '0')}`;
    return `${format(startDate)} - ${format(endDate)}`;
}

function formatDate(firestoreTimestamp: {seconds: number; nanoseconds: number;}) {
    const date = new Date(firestoreTimestamp.seconds * 1000 + firestoreTimestamp.nanoseconds / 1000000);

    const dateNum = date.getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const day = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];

    return `${dateNum.toString().padStart(2, '0')} ${month}, ${day}`; // Format: 04 Dec, Mon
}


const formatStartTime = (firestoreTimestamp: {seconds: number; nanoseconds: number;}) => {
    const date = new Date(firestoreTimestamp.seconds * 1000);

    const hours = date.getHours();
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = date.getMinutes().toString().padStart(2, "0");
    const amPm = hours >= 12 ? 'PM' : 'AM';

    return `${formattedHours}:${formattedMinutes} ${amPm}`;
}

const Ishpe = () => {
    const [events, setEvents] = useState<any> ();
    const { userInfo } = useContext(UserContext)!;
    const userComittees = userInfo?.publicInfo?.committees || [];
    
    const [currentTab, setCurrentTab] = useState<string>()
    const [weekStartDate, setWeekStartDate] = useState(getCurrentSunday()); // Initialize with current week
    const forwardButtonDisabled = (weekStartDate.toISOString().split('T')[0] == getCurrentSunday().toISOString().split('T')[0]);
    // const [starStates, setStarStates] = useState({});

    const getEvents = async() => {
        try{
            const fetchEvents = await fetchEventsForCommittees(userComittees);
            setEvents(fetchEvents);
        } catch (error) {
            console.error("Error retrieving user events:", error);
        }
    }
    getEvents();
    const firstEvent = events?.length > 0 ? events[0] : null;
    // const toggleStar = (eventId: string | number) => {
    //     setStarStates(prev => ({
    //         ...prev,
    //         [eventId]: !prev[eventId]
    //     }));
    // };
    // console.log("events",events)
    // console.log("firstEvent",firstEvent)

    const EventComponent = () => {
        return (
            <View>
                {events.map((event: { id: React.Key | null ; image: any; startDate: {seconds: number; nanoseconds: number;}; name: string | null; location: string | null;  color: string | null}) => (
                    <View key={event?.id} className="flex-row items-start space-x-2">
                    <View style={{ width: 6, height: 75, backgroundColor: '${event.color}', marginLeft: 9}} />
                    <Image
                        className="flex w-20 h-20 rounded-full"
                        defaultSource={Images.EVENT}
                        source={event?.image | Images.EVENT}
                    />
                    <View>
                        <Text className="text-pale-blue font-semibold">{formatDate(event?.startDate)}</Text>
                        <Text className="font-bold">{event?.name}</Text>
                        <View className="flex-row items-center"> 
                            <Text className="text-sm semibold">{event?.location}</Text>
                            <Text className="text-lg text-pale-blue semibold"> • </Text>
                            <Text className="text-sm semibold">{formatStartTime(event?.startDate)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        //onPress={() => toggleStar(firstEvent.id)} 
                        className="items-center justify-end my-3 ml-2">
                            <Octicons name="star-fill" size={25} color="#ffd700"/*{starStates[firstEvent.id] ? 'yellow' : 'grey'} *//>
                    </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };

    // useEffect(() => {
    //     const initialStars = events.reduce((acc: { [x: string]: boolean; }, event: { id: string | number; }) => {
    //         acc[event.id] = false; // Initialize all as not active
    //         return acc;
    //     }, {});
    //     setStarStates(initialStars);
    // }, [events]);

    return (
        <View className="mx-7 bg-gray-100 rounded-md flex-column"> 
            <View className="flex-row bg-gray-200 rounded-md p-3 pb-1">
                <TouchableOpacity 
                    className="flex-1 justify-center items-center" 
                    onPress={() => setCurrentTab('I.SHPE')}>
                    <Text className="font-bold text-center">I.SHPE</Text>
                    {currentTab === 'I.SHPE' && <View className="pt-1 border-b-2 border-pale-blue w-1/2"/>}
                </TouchableOpacity>
                <TouchableOpacity 
                    className="flex-1 justify-center items-center" 
                    onPress={() => setCurrentTab('General')}>
                    <Text className="font-bold text-center">General</Text>
                    {currentTab === 'General' && <View className="pt-1 border-b-2 border-pale-blue w-1/2"/>}
                </TouchableOpacity>
            </View>

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

            {EventComponent()}
        </View>
    );
};
export default Ishpe;