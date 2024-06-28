import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme, Modal } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { fetchUsersWithPublicResumes } from '../../api/firebaseUtils'
import { UserContext } from '../../context/UserContext';
import { MAJORS, PublicUserInfo, UserFilter } from '../../types/user'
import { ResourcesStackParams } from '../../types/navigation'
import ResumeSubmit from './ResumeSubmit'
import ResumeCard from './ResumeCard'


const ResumeBank = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const insets = useSafeAreaInsets();

    const [resumes, setResumes] = useState<PublicUserInfo[]>([])
    const [loading, setLoading] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [filter, setFilter] = useState<UserFilter | null>(null);

    const fetchResumes = async (filter: UserFilter | null) => {
        setLoading(true);
        try {
            const data = await fetchUsersWithPublicResumes(filter);
            setResumes(data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchResumes(null);
    }, [])

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center justify-between'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Resume Bank</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>


            <ScrollView>
                {/* Resume submission */}
                <ResumeSubmit onResumesUpdate={() => fetchResumes(filter)} />
                <View className={` mb-4 mx-4 h-[2px] rounded-full ${darkMode ? "bg-grey-dark" : "bg-grey-light"}`} />

                {/* Filter */}
                <View className='flex-row justify-between items-center mx-4'>
                    {filter?.major && filter.major != "" ? (
                        <TouchableOpacity
                            className={`flex-row items-center px-3 py-2 ${darkMode ? "bg-grey-dark" : "bg-grey-light"} rounded-lg`}
                            onPress={() => {
                                setFilter(null);
                                fetchResumes(null);
                            }}
                        >
                            <Octicons name="x" size={20} color={darkMode ? "white" : "black"} />
                            <Text className={`ml-2 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>{filter.major}</Text>
                        </TouchableOpacity>
                    ) : (<View />)}
                    <TouchableOpacity
                        onPress={() => { setShowFilterModal(true) }}
                        className='mx-c4 p-2'
                    >
                        <Octicons name="filter" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                {/* Resumes */}
                <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
                    {loading && (
                        <View className='flex justify-center items-center mt-4'>
                            <ActivityIndicator size="small" />
                        </View>
                    )}

                    {!loading && resumes.length === 0 && (
                        <View className='flex justify-center items-center mt-8'>
                            <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>No Resumes Found</Text>
                        </View>
                    )}

                    {resumes.map((item, index) => (
                        <ResumeCard
                            key={index}
                            resumeData={item}
                            navigation={navigation}
                            onResumeRemoved={() => fetchResumes(filter)}
                        />
                    ))}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showFilterModal}
                onRequestClose={() => { setShowFilterModal(false); }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className={darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}
                >
                    <View className='flex-row items-center h-10 mb-4'>
                        <View className='w-screen absolute'>
                            <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? 'text-white' : 'text-black'}`}>Select Filter</Text>
                        </View>

                        <TouchableOpacity
                            className='px-4'
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Octicons name="x" size={26} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    <View className={`h-[100%] w-[100%] ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                        <View>
                            <Text className={`text-2xl font-bold mb-4 mx-4 ${darkMode ? "text-white" : "text-black"}`}>Majors</Text>
                            <View className='flex-row flex-wrap ml-4'>
                                {MAJORS.map(({ iso }) => (
                                    <TouchableOpacity
                                        key={iso}
                                        onPress={() => {
                                            if (filter?.major === iso) {
                                                setFilter(null);
                                                fetchResumes(null);
                                                setShowFilterModal(false);
                                            } else {
                                                setFilter({ ...filter!, major: iso });
                                                fetchResumes({ ...filter!, major: iso });
                                                setShowFilterModal(false);
                                            }
                                        }}
                                        className={`px-4 py-2 mr-3 mb-4 rounded-md ${filter?.major === iso ? 'bg-primary-blue' : (darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light')}`}

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
                                    >
                                        <Text className={`text-lg font-semibold ${filter?.major === iso ? "text-white" : (darkMode ? 'text-white' : 'text-black')}`}>{iso}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default ResumeBank
