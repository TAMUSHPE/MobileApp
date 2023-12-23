import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import React, { useContext, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { useRoute } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import InteractButton from '../../components/InteractButton';
import { Picker } from '@react-native-picker/picker';
import { WorkshopType } from '../../types/Events';

const SetSpecificEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    // Form Data Hooks
    const [workshopType, setWorkshopType] = useState<WorkshopType | undefined>(event.workshopType);
    const [signInPoints, setSignInPoints] = useState<number | undefined>(event.signInPoints);
    const [signOutPoints, setSignOutPoints] = useState<number | undefined>(event.signOutPoints);
    const [pointsPerHour, setPointsPerHour] = useState<number | undefined>(event.pointsPerHour);
    const [locationName, setLocationName] = useState<string | undefined>(event.locationName);
    const [geolocation, setGeolocation] = useState<Geolocation | undefined>(event.geolocation);
    const [tags, setTags] = useState<String[]>([]);

    return (
        <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>{event.eventType} Info</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>
            <ScrollView className={`flex flex-col px-4 pt-6 flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`}>
                {
                    event.signInPoints !== undefined &&
                    <>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing In <Text className='text-[#f00]'>*</Text></Text>
                        <KeyboardAvoidingView>
                            <Picker
                                selectedValue={signInPoints}
                                style={{ color: darkMode ? "white" : "black" }}
                                onValueChange={(points) => setSignInPoints(points)}
                                selectionColor={darkMode ? "#ffffff" : "#000000"}
                                dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                            >
                                <Picker.Item label='0' value={0} />
                                <Picker.Item label='1' value={1} />
                                <Picker.Item label='2' value={2} />
                                <Picker.Item label='3' value={3} />
                                <Picker.Item label='4' value={4} />
                                <Picker.Item label='5' value={5} />
                            </Picker>
                        </KeyboardAvoidingView>
                    </>
                }
                {
                    event.signOutPoints !== undefined &&
                    <>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing Out <Text className='text-[#f00]'>*</Text></Text>
                        <KeyboardAvoidingView>
                            <Picker
                                selectedValue={signOutPoints}
                                style={{ color: darkMode ? "white" : "black" }}
                                onValueChange={(points) => setSignOutPoints(points)}
                                selectionColor={darkMode ? "#ffffff" : "#000000"}
                                dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                            >
                                <Picker.Item label='0' value={0} />
                                <Picker.Item label='1' value={1} />
                                <Picker.Item label='2' value={2} />
                                <Picker.Item label='3' value={3} />
                                <Picker.Item label='4' value={4} />
                                <Picker.Item label='5' value={5} />
                            </Picker>
                        </KeyboardAvoidingView>
                    </>
                }
                {
                    event.pointsPerHour !== undefined &&
                    <>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Each Hour Signed In <Text className='text-[#f00]'>*</Text></Text>
                        <KeyboardAvoidingView>
                            <Picker
                                selectedValue={pointsPerHour}
                                style={{ color: darkMode ? "white" : "black" }}
                                onValueChange={(points) => setPointsPerHour(points)}
                                selectionColor={darkMode ? "#ffffff" : "#000000"}
                                dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                            >
                                <Picker.Item label='0' value={0} />
                                <Picker.Item label='1' value={1} />
                                <Picker.Item label='2' value={2} />
                                <Picker.Item label='3' value={3} />
                                <Picker.Item label='4' value={4} />
                                <Picker.Item label='5' value={5} />
                            </Picker>
                        </KeyboardAvoidingView>
                    </>
                }
                {
                    event.workshopType !== undefined &&
                    <>
                        <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Workshop Type <Text className='text-[#f00]'>*</Text></Text>
                        <Picker
                            selectedValue={workshopType}
                            style={{ color: darkMode ? "white" : "black" }}
                            onValueChange={(selectedWorkshopType: WorkshopType) => setWorkshopType(selectedWorkshopType)}
                            selectionColor={darkMode ? "#ffffff" : "#000000"}
                            dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                        >
                            <Picker.Item label='None' value={'None'} />
                            <Picker.Item label='Professional Workshop' value={'Professional'} />
                            <Picker.Item label='Academic Workshop' value={'Academic'} />
                        </Picker>
                    </>
                }
                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Location Name</Text>
                <TextInput
                    className={`text-lg p-2 rounded ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                    value={locationName}
                    placeholder='Where is this event?'
                    onChangeText={(text) => setLocationName(text)}
                    keyboardType='ascii-capable'
                    autoFocus
                    enterKeyHint='enter'
                />


                <InteractButton
                    buttonClassName='bg-orange mt-10 mb-4 py-1 rounded-xl'
                    textClassName='text-center text-white text-lg'
                    label='Next Step'
                    underlayColor='#f2aa96'
                    onPress={() => {
                        if (workshopType == 'None') {
                            Alert.alert("Workshop type is 'None'", "The workshop type must be selected.");
                        }
                        else if (event.copyFromObject) {
                            event.copyFromObject({
                                signInPoints,
                                signOutPoints,
                                pointsPerHour,
                                locationName,
                                geolocation,
                                tags,
                            });
                            navigation.navigate("FinalizeEvent", { event: event });
                        }

                    }}
                />
                <Text className={`text-xl text-center pt-2 ${darkMode ? "text-white" : "text-black"}`}>Step 3 of 4</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SetSpecificEventDetails;
