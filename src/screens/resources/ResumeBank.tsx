import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar';
import { fetchUsersWithPublicResumes } from '../../api/firebaseUtils'
import { PublicUserInfo } from '../../types/User'
import { ResourcesStackParams } from '../../types/Navigation'
import TwitterSvg from '../../components/TwitterSvg'
import DismissibleModal from '../../components/DismissibleModal';
import ResumeSubmit from './ResumeSubmit'
import ResumeCard from './ResumeCard'


const ResumeBank = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const [resumes, setResumes] = useState<PublicUserInfo[]>([])
    const [loading, setLoading] = useState(true);
    const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
    const [filter, setFilter] = useState<{ major: string, classYear: string }>({ major: "", classYear: "" });
    const [infoVisible, setInfoVisible] = useState(false);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const data = await fetchUsersWithPublicResumes();
            setResumes(data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchResumes();
    }, [])


    const handleApplyFilter = async () => {
        const filteredUsers = await fetchUsersWithPublicResumes(filter);
        setResumes(filteredUsers);
    };

    const handleClearFilter = async () => {
        setFilter({ major: "", classYear: "" });
        const filteredUsers = await fetchUsersWithPublicResumes({ major: "", classYear: "" });
        setResumes(filteredUsers);
    };

    return (
        <View className="flex-1 bg-pale-blue">
            <StatusBar style="light" />
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View className='flex-row justify-between items-center mx-5 mt-1'>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>

                    <Text className='text-2xl font-semibold text-white'>Resume Bank</Text>

                    <TouchableOpacity onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="white" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* User Public Resume Info */}
            <ResumeSubmit onResumesUpdate={fetchResumes} />

            <ScrollView
                scrollEventThrottle={400}
                bounces={false}
                className='bg-[#F9F9F9] mt-12 rounded-t-2xl'
            >
                <View className='flex-row justify-start'>
                    <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='my-2 mx-4 p-2'
                    >
                        {showFilterMenu ? (
                            <View className='flex-row items-center space-x-4'>
                                <Octicons name="x" className='bg-red-600' size={30} color="black" />
                                <Text className='font-semibold text-xl'>Filters</Text>
                            </View>
                        ) : (
                            <Octicons name="filter" className='bg-blue' size={30} color="black" />
                        )}
                    </TouchableOpacity>
                </View>

                {showFilterMenu && (
                    <View className='flex-row p-4'>
                        <View className='flex-1 space-y-4'>
                            <View className='justify-start flex-row'>
                                <TextInput
                                    value={filter?.major}
                                    onChangeText={(text) => setFilter({ ...filter, major: text })}
                                    placeholder="Major"
                                    className='bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />

                                <TextInput
                                    value={filter?.classYear}
                                    onChangeText={(text) => setFilter({ ...filter, classYear: text })}
                                    placeholder="Year"
                                    className='bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />

                                <TouchableOpacity
                                    onPress={() => handleApplyFilter()}
                                    className='items-center justify-center bg-pale-blue py-2 w-20 rounded-lg ml-3'>
                                    <Text className='text-white font-bold text-xl'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-start flex-row'>
                                <View className='w-28 mr-4'></View>

                                <View className='w-28 mr-4'></View>

                                <TouchableOpacity
                                    onPress={() => handleClearFilter()}
                                    className='items-center justify-center py-2 w-20 rounded-lg ml-3'>
                                    <Text className='font-bold text-xl text-pale-blue'>Rest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {loading && (
                    <View className='flex justify-center items-center mt-4'>
                        <ActivityIndicator size="large" />
                    </View>
                )}

                {resumes.map((item, index) => (
                    <ResumeCard
                        key={index}
                        resumeData={item}
                        navigation={navigation}
                        onResumeRemoved={() => fetchResumes()}
                    />
                ))}
            </ScrollView>

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'
                    style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color="black" />
                            <Text className='text-2xl font-semibold ml-2'>Points FAQ</Text>
                        </View>

                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text className='text-xl font-semibold'>What is the Resume Bank</Text>
                        <Text className='text-lg font-semibold text-gray-400'>Test Bank is ..</Text>
                    </View>

                    <View>
                        <Text className='text-xl font-semibold'>Earning Points with Resume Bank</Text>
                        <Text className='text-lg font-semibold text-gray-400'>Ways to earn points...</Text>
                    </View>


                    <View>
                        <Text className='text-xl font-semibold'>Officers, Representative, and LeadResumes</Text>
                        <View className='flex-row items-center'>
                            <Text className='text-lg font-semibold text-gray-400'>All officers resumes are marked by</Text>
                            <TwitterSvg color={"#FCE300"} className="ml-2" />
                        </View>
                        <Text className='text-lg font-semibold text-gray-400'>All representative and lead resumes are displayed</Text>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    )
}

export default ResumeBank
