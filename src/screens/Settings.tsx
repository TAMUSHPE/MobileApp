import { View, Text } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native';
import { SettingsScreenRouteProp } from '../types/Navigation';
import { SettingsProps } from '../types/Navigation';


const Setting = ({ navigation }: SettingsProps) => {
    const route = useRoute<SettingsScreenRouteProp>();
    const { userId } = route.params;

    return (
        <View className='flex-1 justify-center items-center'>
            <Text className="text-4xl font-bold text-center">Settings Page w/ Parm</Text>
            <Text className='mt-4 text-2xl font-bold text-center text-green-700'>UserID: {userId}</Text>
        </View>
    )
}

export default Setting