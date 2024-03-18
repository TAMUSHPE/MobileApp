import { View, Text, Alert } from 'react-native'
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/core';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../../types/Navigation'
import { signInToEvent, signOutOfEvent } from '../../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from "lottie-react-native";
import { EventLogStatus } from '../../types/Events';
import { ActivityIndicator } from "react-native";
import { Vibration } from "react-native";

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
                routes: [
                    {
                        name: 'HomeBottomTabs',
                        params: {
                            screen: 'Events',
                            params: {
                                screen: 'EventInfo',
                                params: {
                                    eventId: id,
                                }
                            },
                        },
                    },
                ],
            });
        }, 1000);
    };

    /*useEffect(() => {
        if (logStatus !== EventLogStatus.SUCCESS && logStatus !== undefined) {
            let alertTitle = '';
            let alertDescription = '';

            switch (logStatus) {
                case EventLogStatus.ERROR:
                    alertTitle = 'Error';
                    alertDescription = 'An internal error occurred while attempting. Please try again.';
                    break;
                case EventLogStatus.ALREADY_LOGGED:
                    alertTitle = 'Already Logged';
                    alertDescription = 'You have already logged into this event.';
                    break;
                case EventLogStatus.EVENT_NOT_STARTED:
                    alertTitle = 'Event Not Started';
                    alertDescription = 'This event has not started yet.';
                    break;
                case EventLogStatus.EVENT_OVER:
                    alertTitle = 'Event Over';
                    alertDescription = 'The event has already ended.';
                    break;
                case EventLogStatus.EVENT_NOT_FOUND:
                    alertTitle = 'Event Not Found';
                    alertDescription = 'This event could not be found. Please try either '
                    break;
                default:
                    alertTitle = 'Unknown Status';
                    alertDescription = 'An unknown status was returned. This should never happen.';
                    Alert.alert(alertTitle, alertDescription, [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation?.reset({
                                    index: 0,
                                    routes: [
                                        {
                                            name: 'HomeBottomTabs',
                                            params: {
                                                screen: 'Events',
                                                params: {
                                                    screen: 'EventsScreen',
                                                },
                                            },
                                        },
                                    ],
                                });
                            },
                        },
                    ],
                    );
                    break;
            }

            /*Alert.alert(alertTitle, alertDescription, [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation?.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'HomeBottomTabs',
                                    params: {
                                        screen: 'Events',
                                        params: {
                                            screen: 'EventsScreen',
                                        },
                                    },
                                },
                            ],
                        });
                    },
                },
            ],
            );
        }
    }, [logStatus]);*/


    // const ONE_SECOND_IN_MS = 1000;

    // const PATTERN = [
    // 1 * ONE_SECOND_IN_MS, // wait 1 sec
    // 2 * ONE_SECOND_IN_MS, // vibrate 2 seconds
    // 3 * ONE_SECOND_IN_MS, // wait 3 sec
    // ];

    // const runVibration = () => {Vibration.vibrate(15000)};

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
                            onAnimationFinish={() => {redirectToPage();}}
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
                            onAnimationFinish={() => {redirectToPage();}}
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
                            onAnimationFinish={() => redirectToPage()}
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
                            onAnimationFinish={() => redirectToPage()}
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
                            onAnimationFinish={() => redirectToPage()}
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
                            onAnimationFinish={() => redirectToPage()}
                        />
                    </View>
                    <Text className='text-lg font-semibold'>This event could not be found. Please try either </Text>
                </View>
            }
        </SafeAreaView>
    )
}

export default EventVerification