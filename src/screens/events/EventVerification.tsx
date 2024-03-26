import { View, Text, Alert } from 'react-native'
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/core';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../../types/Navigation'
import { signInToEvent, signOutOfEvent } from '../../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from "lottie-react-native";
import { EventLogStatus } from '../../types/Events';
import { ActivityIndicator } from "react-native";
import * as Haptics from 'expo-haptics';

const EventVerification = ({ navigation }: EventVerificationProps) => {
    const route = useRoute<EventVerificationScreenRouteProp>();
    const { id, mode } = route.params;
    const [logStatus, setLogStatus] = useState<EventLogStatus>();
    console.log(logStatus);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        switch (mode) {
            case "sign-in":
                signInToEvent(id).then((status) => {
                    setLogStatus(status)
                    setLoading(false);
                });
                break;
            case "sign-out":
                signOutOfEvent(id).then((status) => {
                    setLogStatus(status)
                    setLoading(false);
                });
                break;
            default:
                setLogStatus(EventLogStatus.EVENT_NOT_FOUND);
                break;
        }
    }, []);

    const redirectToPage = () => {
        setTimeout(() => {
            navigation?.reset({
                index: 0,
                routes: [{ name: 'HomeBottomTabs' }],
            });
        }, 1000);
    };

    return (
        <SafeAreaView className={`w-screen h-screen   bg-dark-navy ${(logStatus === EventLogStatus.SUCCESS) && "bg-green-500"}`}>
            {
                loading &&
                <View className='w-full h-full items-center justify-center'>
                    <ActivityIndicator className='mt-4' size={"large"} />
                </View>
            }
            {
                (logStatus === EventLogStatus.SUCCESS) &&
                <View className='w-screen h-[70%] items-center justify-center'>
                    <View className=' w-screen h-40 '>
                        <LottieView
                            source={require("../../../assets/check_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>You've successfully signed in</Text>
                </View>
            }
            {
                (logStatus === EventLogStatus.ALREADY_LOGGED) &&
                <View className='w-screen h-[70%] items-center justify-center'>
                    <View className=' w-screen h-40 '>
                        <LottieView
                            source={require("../../../assets/check_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>You have already logged into this event.</Text>
                </View>
            }
            {
                (logStatus === EventLogStatus.ERROR) &&
                <View className='w-screen h-[70%] items-center justify-center'>
                    <View className=' w-screen h-40 '>
                        <LottieView
                            source={require("../../../assets/red_x_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>An internal error occurred while attempting. Please try again.</Text>
                </View>
            }
            {
                (logStatus === EventLogStatus.EVENT_NOT_STARTED) &&
                <View className='w-screen h-[70%] items-center justify-center'>
                    <View className=' w-screen h-40 '>
                        <LottieView
                            source={require("../../../assets/red_x_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>This event has not started yet.</Text>
                </View>
            }
            {
                (logStatus === EventLogStatus.EVENT_OVER) &&
                <View className='w-screen h-[70%] items-center justify-center'>
                    <View className=' w-screen h-40 '>
                        <LottieView
                            source={require("../../../assets/red_x_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>This event has already ended.</Text>
                </View>
            }
            {
                (logStatus === EventLogStatus.EVENT_NOT_FOUND) &&
                <View className='w-screen h-[70%] items-center justify-center'>
                    <View className=' w-screen h-40 '>
                        <LottieView
                            source={require("../../../assets/red_x_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => { redirectToPage(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>This event could not be found. Please try either </Text>
                </View>
            }
        </SafeAreaView>
    )
}

export default EventVerification