import { Alert, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useContext } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { HomeStackParams } from '../../types/navigation';
import { UserContext } from '../../context/UserContext';
import { StatusBar } from 'expo-status-bar';

const functions = getFunctions();

const AdminDashboard = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const committeeCountCheckOnCall = httpsCallable(functions, 'committeeCountCheckOnCall');
    const updateAllUserPoints = httpsCallable(functions, 'updateAllUserPoints');
    const updateCommitteeCount = httpsCallable(functions, 'updateCommitteeCount');
    const resetOfficeOnCall = httpsCallable(functions, 'resetOfficeOnCall');

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />

            <ScrollView>
                {/* Header */}
                <View className='flex-row items-center justify-between mb-3'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Office Dashboard</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>


                <View className={`mx-4`}>
                    {/* Verification Tools */}
                    <Text className={`font-bold text-2xl ${darkMode ? "text-white" : "text-black"}`}>Verification Tools</Text>
                    <View className='flex-row justify-between mt-4'>
                        <TouchableOpacity
                            className={`bg-primary-blue items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('MemberSHPEConfirm')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>MemberSHPE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`bg-primary-blue items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('ShirtConfirm')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>Shirt Pick-up</Text>
                        </TouchableOpacity>
                    </View>
                    <View className='flex-row justify-between mt-4'>
                        <TouchableOpacity
                            className={`bg-primary-blue items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('CommitteeConfirm')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>Committee Membership</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`bg-primary-blue items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('ResumeConfirm')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>Resume Bank</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Other Tools */}
                    <Text className={`mt-8 font-bold text-2xl ${darkMode ? "text-white" : "text-black"}`}>Other Tools</Text>
                    <View className='flex-row justify-between mt-4'>
                        <TouchableOpacity
                            className={`bg-secondary-blue-1 items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('InstagramPoints')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>Instagram Points</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`bg-secondary-blue-1 items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('MOTMEditor')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>Member of the Month</Text>
                        </TouchableOpacity>
                    </View>
                    <View className='flex-row justify-between mt-4'>
                        <TouchableOpacity
                            className={`bg-secondary-blue-1 items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('ResumeDownloader')}
                        >
                            <Text className='text-xl font-semibold text-white text-center'>Resume Downloader</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Admin Tools */}
                    <Text className={`mt-8 font-bold text-2xl ${darkMode ? "text-white" : "text-black"}`}>Admin Tools</Text>
                    <View className='flex-row justify-between mt-4'>
                        <TouchableOpacity
                            className={`bg-secondary-blue-2 items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('LinkEditor')}
                        >
                            <Text className='text-xl font-semibold text-black text-center'>Link Manager</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`bg-secondary-blue-2 items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('FeedbackEditor')}
                        >
                            <Text className='text-xl font-semibold text-black text-center'>App Feedback</Text>
                        </TouchableOpacity>
                    </View>
                    <View className='flex-row justify-between mt-4'>
                        <TouchableOpacity
                            className={`bg-secondary-blue-2 items-center justify-center h-20 rounded-lg w-[48%]`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                            onPress={() => navigation.navigate('RestrictionsEditor')}
                        >
                            <Text className='text-xl font-semibold text-black text-center'>App Restriction</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className={`mt-8 font-bold text-2xl ${darkMode ? "text-white" : "text-black"}`}>Developer Tools</Text>
                    <View>
                        <TouchableOpacity
                            onPress={async () => {
                                await updateAllUserPoints();
                                Alert.alert('Update All User Points', 'Update All User Points have been successfully called');

                            }}
                        >
                            <Text className={`text-xl underline mt-2 ${darkMode ? "text-white" : "text-black"}`}>Update All User Points</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                updateCommitteeCount()
                                Alert.alert('Update Committee Count', 'Update committee count has been called')
                            }}
                        >
                            <Text className={`text-xl underline mt-2 ${darkMode ? "text-white" : "text-black"}`}>Update Committee Count</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                resetOfficeOnCall();
                                Alert.alert('Reset Office Hours', 'Reset Office Hours has been called');
                            }}
                        >
                            <Text className={`text-xl underline mt-2 ${darkMode ? "text-white" : "text-black"}`}>Rest Office</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                committeeCountCheckOnCall()
                                Alert.alert('Committee Count Check', 'Committee Count Check has been called')
                            }}
                        >
                            <Text className={`text-xl underline mt-2 ${darkMode ? "text-white" : "text-black"}`}>Load Committee Membership Count</Text>
                        </TouchableOpacity>
                    </View>
                </View>


                <View className='pb-20' />
            </ScrollView>
        </SafeAreaView>
    )
}

export default AdminDashboard

