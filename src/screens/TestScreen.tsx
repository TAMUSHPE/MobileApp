import { View, Text } from 'react-native'
import React, { useLayoutEffect } from 'react'
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Types
import { RootStackParamList } from '../Navigation/types';
import { TestProps } from '../Navigation/types';


const TestScreen = ({ route, navigation }: TestProps) => {
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, []);
    return (
        <View className='flex-1 items-center justify-center'>
            <Text className='text-slate-700'>TestScreen</Text>
        </View>
    )
}

export default TestScreen