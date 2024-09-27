import { View, Text, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/navigation';
import { SHPEEvent } from '../../types/events';
import { getPastEvents } from '../../api/firebaseUtils';
import EventCard from './EventCard';
import { UserContext } from '../../context/UserContext';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/core';

const PastEvents = ({ navigation }: NativeStackScreenProps<EventsStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

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

    const fetchInitialEvents = async () => {
        setPastEvents([]);
        setLoading(true);
        const { events, lastVisibleDoc } = await getPastEvents(8, null, setEndOfData);
        setPastEvents(events);
        lastVisibleRef.current = lastVisibleDoc;
        setLoading(false);
    };

    useEffect(() => {
        fetchInitialEvents();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchInitialEvents();
            }
        }, [hasPrivileges])
    );


    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent) || endOfData) return;
        loadMoreEvents();
    }, [loading, endOfData, setPastEvents]);

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
            >
                <View className='flex-row items-center'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Past Events</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
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