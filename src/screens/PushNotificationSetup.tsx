import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { requestUserPermission, notificationListener, getFCMToken } from '../helpers/pushNotification'

const PushNotificationSetup = () => {
    useEffect(() => {
        getFCMToken()
        requestUserPermission()
        notificationListener()
    }, [])
    return (
        <View>
            <Text>PushNotificationSetup</Text>
        </View>
    )
}

export default PushNotificationSetup