import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { AdminDashboardParams } from '../../types/Navigation';

const functions = getFunctions();

const AdminDashboard = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const updateRanksOnCall = httpsCallable(functions, 'updateRanksOnCall');
    const committeeCountCheckOnCall = httpsCallable(functions, 'committeeCountCheckOnCall');
    const updateAllUserPoints = httpsCallable(functions, 'updateAllUserPoints');


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
                            onPress={() => navigation.navigate('MOTMEditor')}
                            className='bg-dark-navy rounded-md py-4 px-2 items-center justify-center mr-4'
                        >
                            <Text className='text-white text-xl'>MOTM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ResumeDownloader')}
                            className='bg-dark-navy rounded-md py-4 px-2 items-center justify-center'
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

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Feedback')}
                            className='bg-pale-orange rounded-md py-4 px-2 items-center justify-center ml-2'
                        >
                            <Text className='text-white text-xl'>Feedback</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='py-4 px-2 mx-5'>
                    <Text className='text-2xl font-semibold mb-3'>Developer Testing</Text>
                    <View className='flex-row flex-wrap '>
                        <TouchableOpacity
                            onPress={() => {
                                updateAllUserPoints()
                                Alert.alert('Update All User Points', 'Update All User Points has been called')
                            }}
                            className='bg-black rounded-md py-4 px-2 items-center justify-center'
                        >
                            <Text className='text-white text-xl'>Update All User Points</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ResetOfficeHours')}
                            className='bg-black rounded-md py-4 px-2 items-center justify-center'
                        >
                            <Text className='text-white text-xl'>Rest Office</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                committeeCountCheckOnCall()
                                Alert.alert('Committee Count Check', 'Committee Count Check has been called')
                            }}
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

