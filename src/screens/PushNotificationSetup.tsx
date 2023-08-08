import { Text, TouchableOpacity, SafeAreaView } from 'react-native'
import React, { useEffect } from 'react'
import { requestUserPermission, notificationListener, getFCMToken } from '../helpers/pushNotification'
import { appendFcmToken } from '../api/firebaseUtils'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackNavigatorParams } from '../types/Navigation';
import Constants from 'expo-constants'


const PushNotificationSetup = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParams>) => {
    useEffect(() => {
        const isRunningInExpoGo = Constants.appOwnership === 'expo'
        if (!isRunningInExpoGo) {

            requestUserPermission()
            getFCMToken().then(token => {
                if (token) {
                    appendFcmToken(token)
                }
            }).catch(error => {
                console.error("Failed to get FCM token: ", error);
            });

            notificationListener()
        }
    }, [])
    return (
        <SafeAreaView className='flex-1 justify-center items-center'>
            <TouchableOpacity
                onPress={() => navigation.navigate("SetupCommittees")}
                className='flex justify-center items-center bg-blue-300'
            >
                <Text>To Committees Page</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

export default PushNotificationSetup