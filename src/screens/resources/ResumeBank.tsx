import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { fetchUsersWithPublicResumes } from '../../api/firebaseUtils'
import { MAJORS, PublicUserInfo, UserFilter, classYears } from '../../types/user'
import { ResourcesStackParams } from '../../types/navigation'
import TwitterSvg from '../../components/TwitterSvg'
import DismissibleModal from '../../components/DismissibleModal';
import ResumeSubmit from './ResumeSubmit'
import ResumeCard from './ResumeCard'
import CustomDropDown, { CustomDropDownMethods } from '../../components/CustomDropDown';


const ResumeBank = ({ navigation }: NativeStackScreenProps<ResourcesStackParams>) => {
    const [resumes, setResumes] = useState<PublicUserInfo[]>([])
    const [loading, setLoading] = useState(true);
    const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
    const [filter, setFilter] = useState<UserFilter>({ major: "", classYear: "" });
    const [infoVisible, setInfoVisible] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropDownRefYear = useRef<CustomDropDownMethods>(null);
    const dropDownRefMajor = useRef<CustomDropDownMethods>(null);

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
        handleClearAllSelections();
        setFilter({ major: "", classYear: "" });
        const filteredUsers = await fetchUsersWithPublicResumes({ major: "", classYear: "" });
        setResumes(filteredUsers);
    };

    const handleClearAllSelections = () => {
        dropDownRefYear.current?.clearSelection();
        dropDownRefMajor.current?.clearSelection();
    };

    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
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

            <View
                className='bg-[#F9F9F9] mt-12 rounded-t-2xl flex-1'
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
                            <View className='justify-start flex-row z-20'>
                                <CustomDropDown
                                    data={MAJORS}
                                    onSelect={(item) => setFilter({ ...filter, major: item.iso || "" })}
                                    searchKey="major"
                                    label="Major"
                                    isOpen={openDropdown === 'major'}
                                    onToggle={() => toggleDropdown('major')}
                                    displayType='iso'
                                    ref={dropDownRefMajor}
                                    containerClassName='mr-1'
                                />

                                <CustomDropDown
                                    data={classYears}
                                    onSelect={(item) => setFilter({ ...filter, classYear: item.iso || "" })}
                                    searchKey="year"
                                    label="Class Year"
                                    isOpen={openDropdown === 'year'}
                                    onToggle={() => toggleDropdown('year')}
                                    displayType='iso'
                                    ref={dropDownRefYear}
                                    disableSearch
                                    containerClassName='ml-1'
                                />

                                <TouchableOpacity
                                    onPress={() => handleApplyFilter()}
                                    className='items-center justify-center bg-pale-blue py-2 w-20 rounded-lg ml-3'>
                                    <Text className='text-white font-bold text-xl'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-start flex-row'>
                                <View className='flex-1'></View>
                                <TouchableOpacity
                                    onPress={() => handleClearFilter()}
                                    className='items-center justify-center py-2 w-20 rounded-lg ml-3'>
                                    <Text className='font-bold text-xl text-pale-blue'>Rest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <ScrollView
                    scrollEventThrottle={400}
                    bounces={false}
                    className='-z-10'
                >

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
            </View>

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
