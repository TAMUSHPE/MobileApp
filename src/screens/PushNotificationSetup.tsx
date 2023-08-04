import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { requestUserPermission, notificationListener, getFCMToken, getAvailableOfficersFCMToken } from '../helpers/pushNotification'
import { appendFcmToken } from '../api/firebaseUtils'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackNavigatorParamList } from '../types/Navigation';

const PushNotificationSetup = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    useEffect(() => {
        getFCMToken().then(token => {
            if (token) {
                appendFcmToken(token)
            }
        }).catch(error => {
            console.error("Failed to get FCM token: ", error);
        });

        requestUserPermission()
        notificationListener()

    }, [])
    return (
        <View>
            <TouchableOpacity
                onPress={() => navigation.navigate("SetupCommittees")}
                className='flex justify-center items-center bg-blue-300'
            >
                <Text>To Committees Page</Text>
            </TouchableOpacity>
        </View>
    )
}

export default PushNotificationSetup