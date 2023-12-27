import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { AdminDashboardParams } from '../../types/Navigation';

const AdminDashboard = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const updateRanks = async () => {
        const functions = getFunctions();
        const updateRanksOnCall = httpsCallable(functions, 'updateRanksOnCall');
        updateRanksOnCall()
    }

    const getCommitteesCount = async () => {
        const functions = getFunctions();
        const committeeCountCheckOnCall = httpsCallable(functions, 'committeeCountCheckOnCall');
        committeeCountCheckOnCall()
    }

    return (
        <View className='flex-1'>
            <SafeAreaView edges={['top']} >
                <View className='flex-row items-center mx-5 mt-1'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className="text-2xl font-semibold" >Admin Dashboard</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-2'>
                        <Octicons name="chevron-left" size={30} color={"black"} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView>
                <View className='py-4 px-2 mx-5'>
                    <Text className='text-2xl font-semibold mb-3'>Verification</Text>
                    <View className='flex-row flex-wrap'>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('MemberSHPEConfirm')}
                            className='bg-red-orange rounded-md py-4 px-2 items-center justify-center mr-4'
                        >
                            <Text className='text-white text-xl'>MemberSHPE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ResumeConfirm')}
                            className='bg-red-orange rounded-md py-4 px-2 items-center justify-center'
                        >
                            <Text className='text-white text-xl'>Resume Bank</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='py-4 px-2 mx-5'>
                    <Text className='text-2xl font-semibold mb-3'>Other Tools</Text>
                    <View className='flex-row flex-wrap'>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('MemberOfTheMonthEditor')}
                            className='bg-dark-navy rounded-md py-4 px-2 items-center justify-center mr-4'
                        >
                            <Text className='text-white text-xl'>MOTM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('FeaturedSlideEditor')}
                            className='bg-dark-navy rounded-md py-4 px-2 items-center justify-center'
                        >
                            <Text className='text-white text-xl'>Featured Images</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ResumeDownloader')}
                            className='bg-dark-navy rounded-md py-4 px-2 items-center justify-center mt-3'
                        >
                            <Text className='text-white text-xl'>Resumes Download</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='py-4 px-2 mx-5'>
                    <Text className='text-2xl font-semibold mb-3'>Admin</Text>
                    <View className='flex-row flex-wrap '>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('RestrictionsEditor')}
                            className='bg-pale-orange rounded-md py-4 px-2 items-center justify-center'
                        >
                            <Text className='text-white text-xl'>Restriction</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='py-4 px-2 mx-5'>
                    <Text className='text-2xl font-semibold mb-3'>Developer Testing</Text>
                    <View className='flex-row flex-wrap '>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ResetOfficeHours')}
                            className='bg-black rounded-md py-4 px-2 items-center justify-center'
                        >
                            <Text className='text-white text-xl'>Rest Office</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => updateRanks()}
                            className='bg-black rounded-md py-4 px-2 items-center justify-center mt-3'
                        >
                            <Text className='text-white text-xl'>Update Points and Rank for all Users</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => getCommitteesCount()}
                            className='bg-black rounded-md py-4 px-2 items-center justify-center mt-3'
                        >
                            <Text className='text-white text-xl'>Load Committee Membership Count</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='pb-20' />
            </ScrollView>
        </View>
    )
}

export default AdminDashboard

