import { View, Text } from 'react-native'
import React, { useLayoutEffect } from 'react'

import { SettingsProps } from '../Navigation/types';


const Setting = ({ route, navigation }: SettingsProps) => {
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, []);

    const { userId } = route.params;
    return (
        <View className='flex-1 justify-center items-center'>
            <Text>{userId}</Text>
        </View>
    )
}

export default Setting