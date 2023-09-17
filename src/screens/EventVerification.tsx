import { View, Text, Alert } from 'react-native'
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/core';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../types/Navigation'
import { addEventLog, getEvent } from '../api/firebaseUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from "lottie-react-native";
import { EventLogStatus, SHPEEventID } from '../types/Events';
import { ActivityIndicator } from "react-native";

const EventVerification = ({ navigation }: EventVerificationProps) => {
    const route = useRoute<EventVerificationScreenRouteProp>();
    const { id } = route.params;
    const [logStatus, setLogStatus] = useState<EventLogStatus>();
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        const log = async () => {
            try {
                const res = await addEventLog(id);
                setLogStatus(res);
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        log();
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

    useEffect(() => {
        if (logStatus !== EventLogStatus.SUCCESS && logStatus !== undefined) {
            let alertTitle = '';
            let alertDescription = '';

            switch (logStatus) {
                case EventLogStatus.ERROR:
                    alertTitle = 'Error';
                    alertDescription = 'An error occurred while logging the event.';
                    break;
                case EventLogStatus.ALREADY_LOGGED:
                    alertTitle = 'Already Logged';
                    alertDescription = 'You have already logged into this event.';
                    break;
                case EventLogStatus.EVENT_OVER:
                    alertTitle = 'Event Over';
                    alertDescription = 'The event has already ended.';
                    break;
                default:
                    alertTitle = 'Unknown Status';
                    alertDescription = 'An unknown status was returned.';
                    break;
            }

            Alert.alert(
                alertTitle,
                alertDescription,
                [
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
    }, [logStatus]);



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
                            source={require("../../assets/check_animation.json")}
                            autoPlay
                            loop={false}
                            onAnimationFinish={() => redirectToPage()}
                        />
                    </View>
                    <Text>You're successful signed in </Text>
                </View>
            }
        </SafeAreaView>
    )
}

export default EventVerification