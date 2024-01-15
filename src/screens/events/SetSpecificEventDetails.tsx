import { View, Text, TouchableOpacity, Alert } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { useRoute } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import InteractButton from '../../components/InteractButton';
import { WorkshopType } from '../../types/Events';
import { StatusBar } from 'expo-status-bar';
import { Committee } from '../../types/Committees';
import { getCommittees } from '../../api/firebaseUtils';
import CustomDropDownMenu, { CustomDropDownMethods } from '../../components/CustomDropDown';

const SetSpecificEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const [selectableCommittees, setSelectableCommittees] = useState<Committee[]>([]);
    const dropDownRefCommittee = useRef<CustomDropDownMethods>(null);

    // Form Data Hooks
    const [committee, setCommittee] = useState<string>();
    const [workshopType, setWorkshopType] = useState<WorkshopType | undefined>(event.workshopType ?? undefined);
    const [signInPoints, setSignInPoints] = useState<number | undefined>(event.signInPoints ?? undefined);
    const [signOutPoints, setSignOutPoints] = useState<number | undefined>(event.signOutPoints ?? undefined);
    const [pointsPerHour, setPointsPerHour] = useState<number | undefined>(event.pointsPerHour ?? undefined);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        getCommittees()
            .then((result) => {
                setSelectableCommittees(result);
                const committeeList = createCommitteeList(result);
            })
            .catch(err => console.error("Issue getting committees:", err));
    }, []);

    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
    };

    return (
        <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>{event.eventType} Info</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            <View className='flex-row mx-4 py-4 items-center justify-center flex-wrap'>
                <View className='flex-row items-center justify-center'>
                    <View className='h-7 w-7 bg-pale-blue rounded-full items-center justify-center'>
                        <Octicons name="check" size={20} color="white" />
                    </View>
                    <Text className='text-pale-blue text-lg ml-1'>General</Text>
                </View>

                <View className='ml-3 h-[2px] w-5 bg-pale-blue' />

                <View className='flex-row items-center justify-center ml-1'>
                    <View className='h-7 w-7 bg-pale-blue rounded-full' />
                    <Text className='text-pale-blue text-lg ml-1'>Specific</Text>
                </View>

                <View className='ml-3 h-[2px] w-5 bg-gray-500' />

                <View className='flex-row items-center justify-center ml-1'>
                    <View className='h-7 w-7 border border-gray-500 rounded-full' />
                    <Text className='text-gray-500 text-lg ml-1'>Location</Text>
                </View>
            </View>


            <View className={`flex flex-col px-4 pt-6 flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`}>
                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Associated Committee</Text>
                <View className='flex-row flex-wrap mb-6 z-20'>
                    <CustomDropDownMenu
                        data={createCommitteeList(selectableCommittees)}
                        onSelect={(item) => setCommittee(item.iso)}
                        searchKey="committee"
                        label="Select Committee"
                        isOpen={openDropdown === 'committee'}
                        onToggle={() => toggleDropdown('committee')}
                        displayType='value'
                        ref={dropDownRefCommittee}
                        disableSearch
                    />
                </View>
                <View className='flex-row flex-wrap mb-16'>
                    {event.signInPoints !== undefined &&
                        <View className='w-[48%] mr-[2%] z-30'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing In <Text className='text-[#f00]'>*</Text></Text>
                            <CustomDropDownMenu
                                data={POINTS}
                                onSelect={(item) => setSignInPoints(Number(item.iso))}
                                searchKey="point"
                                label="Select Points"
                                isOpen={openDropdown === 'pointSignIn'}
                                onToggle={() => toggleDropdown('pointSignIn')}
                                displayType='iso'
                                disableSearch
                            />
                        </View>
                    }
                    {event.signOutPoints !== undefined &&
                        <View className='w-[48%] mr-[2%] z-20'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing Out <Text className='text-[#f00]'>*</Text></Text>
                            <CustomDropDownMenu
                                data={POINTS}
                                onSelect={(item) => setSignOutPoints(Number(item.iso))}
                                searchKey="point"
                                label="Select Points"
                                isOpen={openDropdown === 'pointSignOut'}
                                onToggle={() => toggleDropdown('pointSignOut')}
                                displayType='iso'
                                disableSearch
                            />
                        </View>
                    }
                    {event.pointsPerHour !== undefined &&
                        <View className={`w-[48%] mr-[2%] ${(event.signOutPoints != undefined && event.signInPoints != undefined) && "mt-16"}`}>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Hourly Points<Text className='text-[#f00]'>*</Text></Text>
                            <CustomDropDownMenu
                                data={POINTS}
                                onSelect={(item) => setPointsPerHour(Number(item.iso))}
                                searchKey="point"
                                label="Select Points"
                                isOpen={openDropdown === 'pointPerHour'}
                                onToggle={() => toggleDropdown('pointPerHour')}
                                displayType='iso'
                                disableSearch
                            />
                        </View>
                    }
                </View>

                {event.workshopType !== undefined &&
                    <View className='mb-16 -z-10'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Workshop Type <Text className='text-[#f00]'>*</Text></Text>
                        <CustomDropDownMenu
                            data={[
                                { workshopType: "Academic", iso: "Academic" },
                                { workshopType: "Professional", iso: "Professional" }
                            ]}
                            onSelect={(item) => {
                                setWorkshopType(item.iso as WorkshopType);
                                switch (item.iso) {
                                    case "Academic":
                                        setSignInPoints(2);
                                    case "Professional":
                                        setSignInPoints(3);
                                }
                            }}
                            searchKey="workshopType"
                            label="Select Workshop Type"
                            isOpen={openDropdown === 'workshopType'}
                            onToggle={() => toggleDropdown('workshopType')}
                            displayType='value'
                            disableSearch
                        />
                    </View>
                }

                <InteractButton
                    buttonClassName='bg-pale-blue mt-5 mb-4 py-1 rounded-xl w-1/2 mx-auto -z-20'
                    textClassName='text-center text-white text-lg font-bold'
                    label='Next Step'
                    onPress={() => {
                        if (workshopType == 'None') {
                            Alert.alert("Workshop type is 'None'", "The workshop type must be selected.");
                        }
                        else if (event.copyFromObject) {
                            event.copyFromObject({
                                signInPoints,
                                signOutPoints,
                                pointsPerHour,
                                committee,
                            });
                            navigation.navigate("FinalizeEvent", { event: event });
                        }

                    }}
                />
            </View>
        </SafeAreaView>
    );
};

const createCommitteeList = (committees: Committee[]) => {
    return committees.map(committee => ({
        committee: committee.name,
        iso: committee.firebaseDocName
    }));
};

const POINTS = [
    { point: "1", iso: "1" },
    { point: "2", iso: "2" },
    { point: "3", iso: "3" },
    { point: "4", iso: "4" },
    { point: "5", iso: "5" },
]
export default SetSpecificEventDetails;
