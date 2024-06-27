import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { fetchUsersWithPublicResumes } from '../../api/firebaseUtils'
import { PublicUserInfo, UserFilter } from '../../types/user'
import { ResourcesStackParams } from '../../types/navigation'
import ResumeSubmit from './ResumeSubmit'
import ResumeCard from './ResumeCard'
import { UserContext } from '../../context/UserContext';


const ResumeBank = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [resumes, setResumes] = useState<PublicUserInfo[]>([])
    const [loading, setLoading] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [filter, setFilter] = useState<UserFilter>({ major: "", classYear: "" });

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
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center justify-between'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Points Leaderboard</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>


            {/* User Public Resume Info */}
            <ScrollView>
                {/* Resume submission */}
                <ResumeSubmit onResumesUpdate={fetchResumes} />
                <View className={` mb-4 mx-4 h-[2px] rounded-full ${darkMode ? "bg-grey-dark" : "bg-grey-light"}`} />

                {/* Filter */}
                <View className='flex-row justify-end mx-4'>
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

                    {resumes.map((item, index) => (
                        <ResumeCard
                            key={index}
                            resumeData={item}
                            navigation={navigation}
                            onResumeRemoved={() => fetchResumes()}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default ResumeBank
