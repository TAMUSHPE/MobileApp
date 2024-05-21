import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Switch, ScrollView } from 'react-native';
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
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Form Data Hooks
    const [committee, setCommittee] = useState<string>();
    const [workshopType, setWorkshopType] = useState<WorkshopType | undefined>(event.workshopType ?? undefined);
    const [signInPoints, setSignInPoints] = useState<number | undefined>(event.signInPoints ?? undefined);
    const [signOutPoints, setSignOutPoints] = useState<number | undefined>(event.signOutPoints ?? undefined);
    const [pointsPerHour, setPointsPerHour] = useState<number | undefined>(event.pointsPerHour ?? undefined);
    const [nationalConventionEligible, setNationalConventionEligible] = useState<boolean | undefined>(event.nationalConventionEligible ?? undefined);
    const [notificationSent, setNotificationSent] = useState<boolean | undefined>(event.notificationSent ?? undefined);
    const [startTimeBuffer, setStartTimeBuffer] = useState<number | undefined>(event.startTimeBuffer ?? undefined);
    const [endTimeBuffer, setEndTimeBuffer] = useState<number | undefined>(event.endTimeBuffer ?? undefined);

    const eventTypeNotification = ["Study Hours", "Workshop", "Volunteer Event", "Social Event", "Intramural Event"]

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
            <ScrollView>
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
                    <View className='flex-row flex-wrap mb-6 z-30'>
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
                    <View className='flex-row flex-wrap mb-5'>
                        {event.signInPoints !== undefined &&
                            <View className='w-[48%] mr-[2%] z-20'>
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
                            <View className={`w-[48%] mr-[2%] ${(event.signOutPoints != undefined && event.signInPoints != undefined) && "mt-6"}`}>
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

                    <View className='flex-row -z-10'>
                        <View className='w-[48%] mr-[2%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Start Time Buffer (Min)</Text>
                            <CustomDropDownMenu
                                data={TIMES}
                                onSelect={(item) => setStartTimeBuffer(Number(item.iso) * 60000)} // Convert Minute to Milliseconds
                                searchKey="time"
                                label="Select Time"
                                isOpen={openDropdown === 'startTimeBuffer'}
                                onToggle={() => toggleDropdown('startTimeBuffer')}
                                displayType='iso'
                                disableSearch
                            />
                        </View>

                        <View className='w-[48%] mr-[2%]'>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>End Time Buffer (Min)</Text>
                            <CustomDropDownMenu
                                data={TIMES}
                                onSelect={(item) => setEndTimeBuffer(Number(item.iso) * 60000)} // Convert Minute to Milliseconds
                                searchKey="time"
                                label="Select Time"
                                isOpen={openDropdown === 'endTimeBuffer'}
                                onToggle={() => toggleDropdown('endTimeBuffer')}
                                displayType='iso'
                                disableSearch
                            />
                        </View>
                    </View>

                    {event.workshopType !== undefined &&
                        <View className='-z-10 mt-4'>
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


                    {/* When notification is set to off. Then the event's notificationSent will be set to true  */}
                    <KeyboardAvoidingView className='pb-3 -z-20 mt-10'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Notification Settings</Text>
                        <View className="flex flex-row items-center justify-between py-2">
                            <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>Notification</Text>
                            <Switch
                                trackColor={{ false: "#999796", true: "#001F5B" }}
                                thumbColor={!notificationSent ? "#72A9BE" : "#f4f3f4"}
                                ios_backgroundColor="#999796"
                                onValueChange={() => setNotificationSent(previousState => !previousState)}
                                value={!notificationSent}
                            />
                        </View>
                        {!notificationSent && (
                            <View>
                                {event.general ? (
                                    <Text>Event Notification will be sent to all users</Text>
                                ) : (
                                    <>
                                        {(committee && committee !== "") && (
                                            <View>
                                                <Text>The following committee will be notified: {committee}</Text>
                                            </View>
                                        )}
                                        {eventTypeNotification.includes(event.eventType!) && (
                                            <View>
                                                <Text>The following interest will be notified for {event.eventType}</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        )}
                    </KeyboardAvoidingView>

                    <View className='-z-20 mt-10'>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>National Convention</Text>
                        <TouchableOpacity
                            className='flex-row mt-4 items-center -z-20'
                            onPress={() => setNationalConventionEligible(!nationalConventionEligible)}
                        >
                            <View className='h-8 w-8 border-2 border-pale-blue rounded-md items-center justify-center'>
                                {nationalConventionEligible && (
                                    <Octicons name="check" size={26} color="#72A9BE" />
                                )}
                            </View>
                            <Text className='ml-2 text-lg'>Eligible for National Convention</Text>
                        </TouchableOpacity>
                    </View>

                    <InteractButton
                        buttonClassName='bg-pale-blue mt-8 mb-4 py-1 rounded-xl w-1/2 mx-auto -z-20'
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
                                    nationalConventionEligible,
                                    notificationSent,
                                    startTimeBuffer,
                                    endTimeBuffer,
                                });
                                navigation.navigate("setLocationEventDetails", { event: event });
                            }

                        }}
                    />

                    <View className="pb-20" />
                </View>
            </ScrollView>
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
    { point: "0", iso: "0" },
    { point: "1", iso: "1" },
    { point: "2", iso: "2" },
    { point: "3", iso: "3" },
    { point: "4", iso: "4" },
    { point: "5", iso: "5" },
]


const TIMES = [
    { time: "0", iso: "0" },
    { time: "5", iso: "5" },
    { time: "10", iso: "10" },
    { time: "15", iso: "15" },
    { time: "20", iso: "20" },
    { time: "25", iso: "25" },
    { time: "30", iso: "30" },
]
export default SetSpecificEventDetails;
