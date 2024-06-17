import { View, Text, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/navigation';
import { SHPEEvent } from '../../types/events';
import { getPastEvents } from '../../api/firebaseUtils';
import EventCard from './EventCard';

const PastEvents = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const [pastEvents, setPastEvents] = useState<SHPEEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [endOfData, setEndOfData] = useState<boolean>(false);
    const lastVisibleRef = useRef<any>(null);

    const loadMoreEvents = async () => {
        if (loading || endOfData) return;
        setLoading(true);
        const { events, lastVisibleDoc } = await getPastEvents(8, lastVisibleRef.current, setEndOfData);
        setPastEvents([...pastEvents, ...events]);
        lastVisibleRef.current = lastVisibleDoc;
        setLoading(false);
    };

    useEffect(() => {
        const fetchInitialEvents = async () => {
            setLoading(true);
            const { events, lastVisibleDoc } = await getPastEvents(8, null, setEndOfData);
            setPastEvents(events);
            lastVisibleRef.current = lastVisibleDoc;
            setLoading(false);
        };

        fetchInitialEvents();
    }, []);

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent) || endOfData) return;
        loadMoreEvents();
    }, [loading, endOfData, setPastEvents]);

    return (
        <SafeAreaView edges={["top"]} className='h-full bg-white'>
            <ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={400}
            >
                <View className='flex-row items-center'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className="text-3xl font-bold">Past Events</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={"black"} />
                    </TouchableOpacity>
                </View>

                <View className='px-4'>
                    {pastEvents.map((event: SHPEEvent, index) => {
                        return (
                            <View key={event.id} className="mt-8">
                                <EventCard event={event} navigation={navigation} />
                            </View>
                        );
                    })}
                    {loading && (
                        <View className='py-4'>
                            <ActivityIndicator size="small" />
                        </View>
                    )}

                    {endOfData && !loading && (
                        <View className='mt-8'>
                            <Text className='text-xl text-center'>No more events</Text>
                        </View>
                    )}
                </View>

                <View className='pb-24' />
            </ScrollView>
        </SafeAreaView>
    )
}

export default PastEvents;