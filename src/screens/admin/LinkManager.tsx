import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../../types/Navigation';
import { Octicons } from '@expo/vector-icons';

const LinkManager = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    return (
        <SafeAreaView>
            <View className='flex-row items-center mx-5 mt-1'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className="text-2xl font-semibold" >Link Manager</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableOpacity>
            </View>

        </SafeAreaView >
    )
}

export default LinkManager