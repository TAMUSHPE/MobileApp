import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/core';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../../types/Navigation'
import { getEvent, signInToEvent, signOutOfEvent } from '../../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from "lottie-react-native";
import { EventLogStatus, getStatusMessage } from '../../types/Events';
import { ActivityIndicator } from "react-native";
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

const EventVerification = ({ navigation }: EventVerificationProps) => {
    const route = useRoute<EventVerificationScreenRouteProp>();
    const { id, mode } = route.params;
    const [logStatus, setLogStatus] = useState<EventLogStatus | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [checkingLocation, setCheckingLocation] = useState<boolean>(false);

    useEffect(() => {
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

        const statusComponents: { [key in EventLogStatus]: { animation: any, haptic: Haptics.NotificationFeedbackType, bgColor: string } } = {
            [EventLogStatus.SUCCESS]: {
                animation: require("../../../assets/check_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Success,
                bgColor: "bg-green-500"
            },
            [EventLogStatus.ALREADY_LOGGED]: {
                animation: require("../../../assets/red_x_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Warning,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.ERROR]: {
                animation: require("../../../assets/red_x_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.EVENT_NOT_STARTED]: {
                animation: require("../../../assets/red_x_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.EVENT_OVER]: {
                animation: require("../../../assets/red_x_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            [EventLogStatus.EVENT_NOT_FOUND]: {
                animation: require("../../../assets/red_x_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            },
            // Default case for missing EventLogStatus.EVENT_ONGOING
            [EventLogStatus.EVENT_ONGOING]: {
                animation: require("../../../assets/red_x_animation.json"),
                haptic: Haptics.NotificationFeedbackType.Error,
                bgColor: "bg-dark-navy"
            }
        };

        const { animation, haptic, bgColor } = statusComponents[logStatus];
        const message = getStatusMessage(logStatus);

        return (
            <View className={`w-screen h-[70%] items-center justify-center ${bgColor}`}>
                <View className='w-screen h-40'>
                    <LottieView
                        source={animation}
                        autoPlay
                        loop={false}
                        onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(haptic); }}
                    />
                </View>
                <Text className='text-lg font-semibold text-white'>{message}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView className={`w-screen h-screen bg-dark-navy ${(logStatus === EventLogStatus.SUCCESS) && "bg-green-500"}`}>
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

export default EventVerification;