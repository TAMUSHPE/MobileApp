import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Switch, ScrollView } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/navigation';
import { useRoute } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import InteractButton from '../../components/InteractButton';
import { WorkshopType } from '../../types/events';
import { StatusBar } from 'expo-status-bar';
import { Committee, reverseFormattedFirebaseName } from '../../types/committees';
import { getCommittees } from '../../api/firebaseUtils';
import CustomDropDownMenu, { CustomDropDownMethods } from '../../components/CustomDropDown';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import DismissibleModal from '../../components/DismissibleModal';

const SetSpecificEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const insets = useSafeAreaInsets();

    const [selectableCommittees, setSelectableCommittees] = useState<Committee[]>([]);
    const [advanceOptionsModal, setAdvanceOptionsModal] = useState<boolean>(false);
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
    const [startTimeBuffer, setStartTimeBuffer] = useState<number | undefined>(event.startTimeBuffer ?? 20 * 60000);
    const [endTimeBuffer, setEndTimeBuffer] = useState<number | undefined>(event.endTimeBuffer ?? 20 * 60000);
    const [hiddenEvent, setHiddenEvent] = useState<boolean | undefined>(event.hiddenEvent ?? undefined);
    const [isGeneral, setIsGeneral] = useState<boolean>(event.general ?? false);


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
        <View>
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            >
                <SafeAreaView className={`flex flex-col h-screen`}>
                    <StatusBar style={darkMode ? "light" : "dark"} />
                    {/* Header */}
                    <View className='flex-row items-center'>
                        <View className='absolute w-full justify-center items-center'>
                            <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Specific Details</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                            <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View className={`flex-1`}>
                        {/* Point Selection */}
                        <View className='px-4 mt-4'>
                            <Text className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-black"}`}>Points Selection</Text>

                            <View className='space-y-4'>
                                {event.signInPoints !== undefined && (
                                    <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                                        <Text className='flex-1 text-xl font-semibold'>Sign In</Text>

                                        <View className='w-[75%] flex-row space-x-3'>
                                            {points.map((point) => (
                                                <TouchableOpacity
                                                    key={point}
                                                    className={`w-10 h-10 rounded-xl items-center border justify-center ${signInPoints === point ? "bg-primary-blue border-primary-blue" : "bg-secondary-bg-light border-grey-dark"}`}
                                                    onPress={() => {
                                                        if (signInPoints === point) {
                                                            setSignInPoints(undefined);
                                                        } else {
                                                            setSignInPoints(point);
                                                        }
                                                    }}
                                                >
                                                    <Text className={`text-white text-xl font-semibold ${signInPoints === point ? "text-white" : "text-black"}`}>+{point}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {event.signOutPoints !== undefined && (
                                    <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                                        <Text className='flex-1 text-xl font-semibold'>Sign Out</Text>

                                        <View className='w-[75%] flex-row space-x-3'>
                                            {points.map((point) => (
                                                <TouchableOpacity
                                                    key={point}
                                                    className={`w-10 h-10 rounded-xl items-center border justify-center ${signOutPoints === point ? "bg-primary-blue border-primary-blue" : "bg-secondary-bg-light border-grey-dark"}`}
                                                    onPress={() => {
                                                        if (signOutPoints === point) {
                                                            setSignOutPoints(undefined);
                                                        } else {
                                                            setSignOutPoints(point);
                                                        }
                                                    }}
                                                >
                                                    <Text className={`text-white text-xl font-semibold ${signOutPoints === point ? "text-white" : "text-black"}`}>+{point}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {event.pointsPerHour !== undefined && (
                                    <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                                        <Text className='flex-1 text-xl font-semibold'>Hourly</Text>

                                        <View className='w-[75%] flex-row space-x-3'>
                                            {points.map((point) => (
                                                <TouchableOpacity
                                                    key={point}
                                                    className={`w-10 h-10 rounded-xl items-center border justify-center ${pointsPerHour === point ? "bg-primary-blue border-primary-blue" : "bg-secondary-bg-light border-grey-dark"}`}
                                                    onPress={() => {
                                                        if (pointsPerHour === point) {
                                                            setPointsPerHour(undefined);
                                                        } else {
                                                            setPointsPerHour(point);
                                                        }
                                                    }}
                                                >
                                                    <Text className={`text-white text-xl font-semibold ${pointsPerHour === point ? "text-white" : "text-black"}`}>+{point}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                            </View>
                        </View>
                        {/* Event Scope (Club-Wide, Associated Committees, Notifications)*/}
                        <View className='px-4 mt-10'>
                            <Text className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-black"}`}>Event Scope</Text>

                            <View className='space-y-4'>
                                <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                                    <Text className='flex-1 text-xl font-semibold'>Club-Wide</Text>
                                    <Switch
                                        trackColor={{ false: "#B4B4B4", true: "#1870B8" }}
                                        thumbColor={"white"}
                                        ios_backgroundColor="#999796"
                                        onValueChange={() => setIsGeneral(previousState => !previousState)}
                                        value={isGeneral}
                                    />
                                </View>

                                <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                                    <Text className='flex-1 text-xl font-semibold'>Associated Committee</Text>
                                    <View className='flex-row flex-wrap w-[60%]'>
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
                                </View>

                                <View className='-z-10'>
                                    <View className='flex-col px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                                        <View className='flex-row items-center justify-between w-full flex-1'>
                                            <Text className='flex-1 text-xl font-semibold'>Notifications</Text>
                                            <Switch
                                                trackColor={{ false: "#B4B4B4", true: "#1870B8" }}
                                                thumbColor={"white"}
                                                ios_backgroundColor="#999796"
                                                onValueChange={() => setNotificationSent(previousState => !previousState)}
                                                value={!notificationSent}
                                            />
                                        </View>
                                    </View>
                                    {!notificationSent && (
                                        <View className='mt-1 w-full justify-center items-center'>
                                            {isGeneral ? (
                                                <Text>All Members will be notified</Text>
                                            ) : (
                                                <>
                                                    {committee && committee !== "" && eventTypeNotification.includes(event.eventType!) ? (
                                                        <Text className='text-center'>This will notify <Text className='text-semibold text-primary-blue'>{reverseFormattedFirebaseName(committee)}</Text> members and those interested in <Text className='text-semibold text-primary-blue'>{event.eventType}</Text></Text>
                                                    ) : (
                                                        <View>
                                                            {committee && committee !== "" && (
                                                                <Text className='text-center'>Member in <Text className='text-semibold text-primary-blue'>{reverseFormattedFirebaseName(committee)}</Text> will be notified</Text>
                                                            )}

                                                            {eventTypeNotification.includes(event.eventType!) && (
                                                                <Text className='text-center'>Members interested in <Text className='text-semibold text-primary-blue'>{event.eventType}</Text> will be notified</Text>
                                                            )}
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View className='w-full mt-8 -z-10 '>
                            <TouchableOpacity className='mb-3 items-center'
                                onPress={() => setAdvanceOptionsModal(true)}
                            >
                                <Text className='underline text-lg font-medium'>Advanced Options</Text>
                            </TouchableOpacity>

                            <InteractButton
                                buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                                textClassName='text-center text-white text-2xl font-bold'
                                label='Next'
                                onPress={() => {
                                    // if (workshopType == 'None') {
                                    //     Alert.alert("Workshop type is 'None'", "The workshop type must be selected.");
                                    // }
                                    // else 
                                    if (event.copyFromObject) {
                                        event.copyFromObject({
                                            signInPoints,
                                            signOutPoints,
                                            pointsPerHour,
                                            committee,
                                            nationalConventionEligible,
                                            notificationSent,
                                            startTimeBuffer,
                                            endTimeBuffer,
                                            hiddenEvent,
                                            general: isGeneral
                                        });
                                        navigation.navigate("setLocationEventDetails", { event: event });
                                    }

                                }}
                            />
                            <View className='mb-3 items-center'>
                                <Text className='text-red-1 text-lg font-medium'>Specific details can not be changed later* </Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>

                {openDropdown && (
                    <View className='pb-16' />
                )}
            </KeyboardAwareScrollView>

            <DismissibleModal
                visible={advanceOptionsModal}
                setVisible={setAdvanceOptionsModal}
            >
                <View className='flex bg-white h-screen w-screen'>
                    {/* Header */}
                    <View style={{ marginTop: insets.top }} className='flex-row items-center'>
                        <View className='absolute w-full justify-center items-center'>
                            <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Advanced Options</Text>
                        </View>
                        <TouchableOpacity onPress={() => setAdvanceOptionsModal(false)} className='py-1 px-4'>
                            <Octicons name="x" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    {/* Advance Options */}
                    <View className='px-4 mt-10 space-y-8'>
                        <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                            <Text className='flex-1 text-xl font-semibold'>Eligible for National Convention</Text>
                            <Switch
                                trackColor={{ false: "#B4B4B4", true: "#1870B8" }}
                                thumbColor={"white"}
                                ios_backgroundColor="#999796"
                                onValueChange={() => setNationalConventionEligible(previousState => !previousState)}
                                value={nationalConventionEligible}
                            />
                        </View>

                        <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                            <Text className='flex-1 text-xl font-semibold'>Hidden Event</Text>
                            <Switch
                                trackColor={{ false: "#B4B4B4", true: "#1870B8" }}
                                thumbColor={"white"}
                                ios_backgroundColor="#999796"
                                onValueChange={() => setHiddenEvent(previousState => !previousState)}
                                value={hiddenEvent}
                            />
                        </View>

                        <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg'
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
                            <Text className='flex-1 text-xl font-semibold'>Start Buffer (mins)</Text>
                            <View className='flex-row flex-wrap w-[60%]'>
                                <CustomDropDownMenu
                                    data={TIMES}
                                    onSelect={(item) => setStartTimeBuffer(Number(item.iso) * 60000)} // Convert Minute to Milliseconds
                                    searchKey="time"
                                    label="Select Time"
                                    isOpen={openDropdown === 'startTimeBuffer'}
                                    onToggle={() => toggleDropdown('startTimeBuffer')}
                                    displayType='iso'
                                    disableSearch
                                    selectedItemProp={startTimeBuffer ? { value: ((startTimeBuffer / 60000).toFixed(0)).toString(), iso: ((startTimeBuffer / 60000).toFixed(0)).toString() } : null}
                                />
                            </View>
                        </View>

                        <View className='flex-row items-center justify-between w-full px-4 bg-secondary-bg-light h-16 rounded-lg -z-10'
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
                            <Text className='flex-1 text-xl font-semibold'>End Buffer (mins)</Text>
                            <View className='flex-row flex-wrap w-[60%]'>
                                <CustomDropDownMenu
                                    data={TIMES}
                                    onSelect={(item) => setEndTimeBuffer(Number(item.iso) * 60000)} // Convert Minute to Milliseconds
                                    searchKey="time"
                                    label="Select Time"
                                    isOpen={openDropdown === 'endTimeBuffer'}
                                    onToggle={() => toggleDropdown('endTimeBuffer')}
                                    displayType='iso'
                                    disableSearch
                                    selectedItemProp={startTimeBuffer ? { value: ((startTimeBuffer / 60000).toFixed(0)).toString(), iso: ((startTimeBuffer / 60000).toFixed(0)).toString() } : null}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    );
};

const createCommitteeList = (committees: Committee[]) => {
    return committees.map(committee => ({
        committee: committee.name,
        iso: committee.firebaseDocName
    }));
};

const points = [0, 1, 2, 3, 4];

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
