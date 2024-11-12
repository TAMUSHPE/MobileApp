import { View, Text } from 'react-native'
import React, { useContext, useEffect, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/core';
import { MainStackParams } from '../../types/navigation'
import { getEvent, signInToEvent, signOutOfEvent } from '../../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventLogStatus, getStatusMessage } from '../../types/events';
import { ActivityIndicator } from "react-native";
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VerificationAnimation, VerificationAnimationTypes } from '../../components/VerificationAnimation';

const EventVerification: React.FC<EventVerificationScreenRouteProp> = ({ route, navigation }) => {
    const { id, mode } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const [logStatus, setLogStatus] = useState<EventLogStatus | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [checkingLocation, setCheckingLocation] = useState<boolean>(false);

    useEffect(() => {
        if (!userInfo?.publicInfo?.isStudent) {
            setLogStatus(EventLogStatus.NOT_A_STUDENT);
            setLoading(false);
            return;
        }

        switch (mode) {
            case 'sign-in':
                signInToEvent(id).then((status) => {
                    setLogStatus(status);
                    setLoading(false);
                });
                break;
            case 'sign-out':
                signOutOfEvent(id).then((status) => {
                    setLogStatus(status);
                    setLoading(false);
                });
                break;
            default:
                setLogStatus(EventLogStatus.EVENT_NOT_FOUND);
                setLoading(false);
                break;
        }
    }, [id, mode]);


    useEffect(() => {
        const fetchEventDetails = async (eventId: string) => {
            const event = await getEvent(eventId);
            if (!event) {
                setLogStatus(EventLogStatus.EVENT_NOT_FOUND);
                return;
            }

            if (event.geofencingRadius && event.geofencingRadius > 0) {
                setCheckingLocation(true);
            }
        };

        fetchEventDetails(id);
    }, [id]);


    const redirectToPage = () => {
        setTimeout(() => {
            navigation?.reset({
                index: 0,
                routes: [{ name: 'HomeBottomTabs' }],
            });
        }, 1000);
    };

    const renderStatusView = () => {
        if (logStatus === undefined) return null;

        const statusComponents: { [key in EventLogStatus]: { animation: VerificationAnimationTypes, haptic: Haptics.NotificationFeedbackType, bgColor: string } } = {
            [EventLogStatus.SUCCESS]: {
                animation: 'check_animation',
                haptic: Haptics.NotificationFeedbackType.Success,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.ALREADY_LOGGED]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Warning,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.ERROR]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.EVENT_NOT_STARTED]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.EVENT_OVER]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.EVENT_NOT_FOUND]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.NOT_A_STUDENT]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.OUT_OF_RANGE]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.GEOLOCATION_NOT_FOUND]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            // Default case for missing EventLogStatus.EVENT_ONGOING
            [EventLogStatus.EVENT_ONGOING]: {
                animation: 'red_x_animation',
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            }
        };

        const { animation, haptic, bgColor } = statusComponents[logStatus];
        const message = getStatusMessage(logStatus, mode);

        return (
            <View className={`w-screen h-[70%] items-center justify-center ${bgColor}`}>
                <View className='w-screen h-40'>
                    <VerificationAnimation
                        animation={animation}
                        loop={false}
                        onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(haptic); }}
                    />
                </View>
                <Text className='text-lg font-semibold text-white'>{message}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView className={`w-screen h-screen bg-dark-navy`}>
            <StatusBar style="light" />

            {loading ? (
                <View className='w-full h-full items-center justify-center'>
                    <ActivityIndicator className='mt-4' color="white" size={"large"} />
                    {checkingLocation && (
                        <Text className='text-lg font-semibold text-white mt-4'>This will take a few seconds as we check your location...</Text>
                    )}
                </View>
            ) : (
                renderStatusView()
            )}
        </SafeAreaView>
    );
};


type EventVerificationScreenRouteProp = {
    route: RouteProp<MainStackParams, 'EventVerificationScreen'>;
    navigation: NativeStackNavigationProp<MainStackParams, 'EventVerificationScreen'>;
};


export default EventVerification;