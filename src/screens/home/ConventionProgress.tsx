import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import React, { useCallback, useContext, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getConventionAttendanceData } from '../../api/firebaseUtils';
import { HomeStackParams } from '../../types/navigation';
import {
    CategoryProgress,
    MemberConventionProgress,
    buildMemberConventionProgress,
    formatConventionDatePill,
} from '../../helpers/conventionTracker';
import ProgressBar from '../../components/ProgressBar';

const RING_SIZE = 140;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ConventionProgress = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<MemberConventionProgress | null>(null);
    const [loadError, setLoadError] = useState(false);

    const loadProgress = useCallback(async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            setProgress(null);
            setLoadError(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError(false);
        try {
            const data = await getConventionAttendanceData(uid);
            setProgress(
                buildMemberConventionProgress({
                    selected: data.selected,
                    dateAdded: data.dateAdded,
                    logs: data.logs,
                    eventById: data.eventById,
                })
            );
        } catch (error) {
            console.error('Error loading convention progress:', error);
            setProgress(null);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProgress();
        }, [loadProgress])
    );

    const textPrimary = darkMode ? 'text-white' : 'text-black';
    const textMuted = darkMode ? 'text-grey-light' : 'text-grey-dark';
    const trackColor = darkMode ? '#404040' : '#E5E5E5';
    const fillColor = '#1870B8';

    const ringProgress = progress ? progress.met / progress.total : 0;
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - ringProgress);

    return (
        <SafeAreaView edges={['top']} className={`h-full ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
            <StatusBar style={darkMode ? 'light' : 'dark'} />
            <View className="flex-row items-center justify-between mb-3">
                <View className="absolute w-full justify-center items-center">
                    <Text className={`text-3xl font-bold ${textPrimary}`}>Convention Progress</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className="py-1 px-4">
                    <Octicons name="chevron-left" size={30} color={darkMode ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={fillColor} />
                </View>
            ) : loadError ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className={`text-xl text-center font-semibold ${textPrimary}`}>
                        We couldn't load your convention progress.
                    </Text>
                    <Text className={`text-base text-center mt-3 ${textMuted}`}>
                        Check your connection and try again.
                    </Text>
                    <TouchableOpacity
                        onPress={loadProgress}
                        className="mt-6 rounded-md bg-primary-blue px-6 py-3"
                    >
                        <Text className="text-base font-semibold text-white">Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : !progress?.selected ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className={`text-xl text-center font-semibold ${textPrimary}`}>
                        You're not on the convention roster.
                    </Text>
                    <Text className={`text-base text-center mt-3 ${textMuted}`}>
                        An officer must add you via Convention Tracker before progress is shown here.
                    </Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="items-center mt-6 mb-2">
                        <View className="items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
                            <Svg width={RING_SIZE} height={RING_SIZE}>
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RING_RADIUS}
                                    stroke={trackColor}
                                    strokeWidth={RING_STROKE}
                                    fill="none"
                                />
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RING_RADIUS}
                                    stroke={fillColor}
                                    strokeWidth={RING_STROKE}
                                    fill="none"
                                    strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    rotation="-90"
                                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                                />
                            </Svg>
                            <View className="absolute items-center justify-center">
                                <Text className={`text-4xl font-bold ${textPrimary}`}>
                                    {progress.met}/{progress.total}
                                </Text>
                            </View>
                        </View>
                        <Text className={`mt-3 text-sm tracking-widest font-medium ${textMuted}`}>
                            REQUIREMENTS MET
                        </Text>
                        {progress.eligible && (
                            <View className="mt-2 px-3 py-1 rounded-md bg-primary-blue">
                                <Text className="text-white font-semibold">Eligible</Text>
                            </View>
                        )}
                    </View>

                    <View className="mx-8 mt-4 mb-2">
                        <ProgressBar progress={ringProgress} />
                        <View className="flex-row justify-between mt-2">
                            <Text className={`text-sm ${textMuted}`}>{progress.met} completed</Text>
                            <Text className={`text-sm ${textMuted}`}>
                                {progress.total - progress.met} remaining
                            </Text>
                        </View>
                    </View>

                    <View className="mx-6 mt-6">
                        {progress.categories.map((category, index) => (
                            <CategorySection
                                key={category.key}
                                category={category}
                                darkMode={!!darkMode}
                                showDivider={index < progress.categories.length - 1}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const CategorySection = ({
    category,
    darkMode,
    showDivider,
}: {
    category: CategoryProgress;
    darkMode: boolean;
    showDivider: boolean;
}) => {
    const textPrimary = darkMode ? 'text-white' : 'text-black';
    const textMuted = darkMode ? 'text-grey-light' : 'text-grey-dark';
    const emptySlots = Array.from({ length: category.remainingSlots });

    return (
        <View className={showDivider ? 'mb-6 pb-6 border-b border-grey-light' : 'mb-4'}>
            <View className="flex-row items-center justify-between mb-3">
                <Text className={`text-2xl font-bold ${textPrimary}`}>{category.label}</Text>
                <View className="flex-row items-center">
                    {category.complete && (
                        <View className="w-5 h-5 rounded-sm bg-primary-blue items-center justify-center mr-2">
                            <Octicons name="check" size={12} color="white" />
                        </View>
                    )}
                    <Text className={`text-lg font-semibold ${textPrimary}`}>
                        {category.count}/{category.required}
                    </Text>
                </View>
            </View>

            {category.events.map((event) => (
                <View key={event.eventId} className="flex-row items-center mb-3">
                    <View className="w-6 h-6 rounded-full bg-primary-blue items-center justify-center mr-3">
                        <Octicons name="check" size={14} color="white" />
                    </View>
                    <Text
                        className={`flex-1 text-base ${textMuted}`}
                        style={{ textDecorationLine: 'line-through' }}
                        numberOfLines={1}
                    >
                        {event.name || 'Untitled event'}
                    </Text>
                    {!!event.startTime && (
                        <View className={`ml-2 px-2 py-1 rounded-full ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}>
                            <Text className={`text-xs ${textMuted}`}>
                                {formatConventionDatePill(event.startTime)}
                            </Text>
                        </View>
                    )}
                </View>
            ))}

            {emptySlots.map((_, index) => (
                <View key={`empty-${category.key}-${index}`} className="flex-row items-center mb-3">
                    <View
                        className="w-6 h-6 rounded-full mr-3"
                        style={{ borderWidth: 2, borderColor: darkMode ? '#808080' : '#B4B4B4' }}
                    />
                    <View className="flex-1 h-3 rounded" style={{ backgroundColor: darkMode ? '#333' : '#EEE' }} />
                </View>
            ))}
        </View>
    );
};

export default ConventionProgress;
