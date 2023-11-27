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
        updateRanksOnCall()
    }

    const getTrueCommittesCount = async () => {
        const functions = getFunctions();
        const callUpdateCommitteesCount = httpsCallable(functions, 'updateCommitteesCountOnCall');
        callUpdateCommitteesCount()
    }


    return (
        <SafeAreaView className='items-center justify-center space-y-4' edges={['right', 'top', 'left']}>
            <TouchableOpacity
                onPress={() => updateRanks()}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update Points and Rank for all Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => getTrueCommittesCount()}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Load Committee Membership Count</Text>
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
            <TouchableOpacity
                onPress={() => navigation.navigate('FeaturedSlideEditor')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Home Featured Slider</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('ResumeDownloader')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Resume Downloader</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('ResetOfficeHours')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Test Reset Office Hour</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('RestrictionsEditor')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update Restrictions</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('MemberSHPEConfirm')}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Member SHPE Verifications</Text>
            </TouchableOpacity>

        </SafeAreaView>
    )
}

export default AdminDashboard