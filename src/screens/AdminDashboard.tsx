import { Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { httpsCallable, getFunctions } from 'firebase/functions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminDashboardParams } from '../types/Navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminDashboard = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const updateRanks = async () => {
        const functions = getFunctions();
        const updateRanksOnCall = httpsCallable(functions, 'updateRanksOnCall');
        await updateRanksOnCall()
    }

    return (
        <SafeAreaView className='items-center justify-center space-y-4'  edges={['right', 'top', 'left']}>
            <TouchableOpacity
                onPress={() => updateRanks()}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update Points and Rank for all Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('CommitteesEditor')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>update committee info</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('MemberOfTheMonthEditor')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update Member of the Month</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}

export default AdminDashboard