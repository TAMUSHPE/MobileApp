import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Alert, Switch, TouchableHighlight } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { useRoute } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import InteractButton from '../../components/InteractButton';
import { Picker } from '@react-native-picker/picker';
import { WorkshopType } from '../../types/Events';
import { StatusBar } from 'expo-status-bar';
import { Committee } from '../../types/Committees';
import { getCommittees } from '../../api/firebaseUtils';
import LocationPicker from '../../components/LocationPicker';
import { GeoPoint } from 'firebase/firestore';
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete';

const SetSpecificEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const [selectableCommittees, setSelectableCommittees] = useState<Committee[]>([]);

    useEffect(() => {
        getCommittees()
            .then((result) => setSelectableCommittees(result))
            .catch(err => console.error("Issue getting committees:", err));
    }, []);

    // UI Hooks
    const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
    const [geofencingEnabled, setGeofencingEnabled] = useState<boolean>(false);
    const [locationDetails, setLocationDetails] = useState<GooglePlaceDetail | null>();

    // Form Data Hooks
    const [committee, setCommittee] = useState<string>();
    const [workshopType, setWorkshopType] = useState<WorkshopType | undefined>(event.workshopType ?? undefined);
    const [signInPoints, setSignInPoints] = useState<number | undefined>(event.signInPoints ?? undefined);
    const [signOutPoints, setSignOutPoints] = useState<number | undefined>(event.signOutPoints ?? undefined);
    const [pointsPerHour, setPointsPerHour] = useState<number | undefined>(event.pointsPerHour ?? undefined);
    const [locationName, setLocationName] = useState<string | undefined>(event.locationName ?? undefined);
    const [geolocation, setGeolocation] = useState<GeoPoint | undefined>(event.geolocation ?? undefined);
    const [geofencingRadius, setGeofencingRadius] = useState<number | undefined>(event.geofencingRadius ?? undefined);
    const [tags, setTags] = useState<string[]>([]);

    return (
        <>
            <LocationPicker
                visible={showLocationPicker}
                setVisible={setShowLocationPicker}
                onLocationChange={(location, radius) => {
                    if (location?.geometry.location.lat && location?.geometry.location.lng) {
                        setLocationDetails(location);
                        setGeolocation(new GeoPoint(location?.geometry.location.lat, location?.geometry.location.lng));
                        setGeofencingRadius(radius);
                    }
                }}
            />
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
                <ScrollView
                    className={`flex flex-col px-4 pt-6 flex-1 ${darkMode ? "bg-primary-bg-dark" : ""}`}
                    contentContainerStyle={{
                        paddingBottom: "50%"
                    }}
                >
                    {event.signInPoints !== undefined &&
                        <View>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing In <Text className='text-[#f00]'>*</Text></Text>
                            <KeyboardAvoidingView>
                                <Picker
                                    mode='dropdown'
                                    selectedValue={signInPoints}
                                    onValueChange={(points) => setSignInPoints(points)}
                                    style={{ color: darkMode ? "white" : "black" }}
                                    selectionColor={darkMode ? "#FFF4" : "0004"}
                                    itemStyle={{
                                        color: darkMode ? "white" : "black"
                                    }}
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
                        </View>
                    }
                    {event.signOutPoints !== undefined &&
                        <View>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Signing Out <Text className='text-[#f00]'>*</Text></Text>
                            <KeyboardAvoidingView>
                                <Picker
                                    mode='dropdown'
                                    selectedValue={signOutPoints}
                                    onValueChange={(points) => setSignOutPoints(points)}
                                    style={{ color: darkMode ? "white" : "black" }}
                                    selectionColor={darkMode ? "#FFF4" : "0004"}
                                    itemStyle={{
                                        color: darkMode ? "white" : "black"
                                    }}
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
                        </View>
                    }
                    {event.pointsPerHour !== undefined &&
                        <View>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Points for Each Hour Signed In <Text className='text-[#f00]'>*</Text></Text>
                            <KeyboardAvoidingView>
                                <Picker
                                    mode='dropdown'
                                    selectedValue={pointsPerHour}
                                    onValueChange={(points) => setPointsPerHour(points)}
                                    style={{ color: darkMode ? "white" : "black" }}
                                    selectionColor={darkMode ? "#FFF4" : "0004"}
                                    itemStyle={{
                                        color: darkMode ? "white" : "black"
                                    }}
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
                        </View>
                    }
                    {event.workshopType !== undefined &&
                        <View>
                            <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Workshop Type <Text className='text-[#f00]'>*</Text></Text>
                            <Picker
                                selectedValue={workshopType}
                                onValueChange={(selectedWorkshopType: WorkshopType) => {
                                    setWorkshopType(selectedWorkshopType);
                                    switch (selectedWorkshopType) {
                                        case "Academic":
                                            setSignInPoints(2);
                                        case "Professional":
                                            setSignInPoints(3);
                                    }
                                }}
                                style={{ color: darkMode ? "white" : "black" }}
                                selectionColor={darkMode ? "#FFF4" : "0004"}
                                itemStyle={{
                                    color: darkMode ? "white" : "black"
                                }}
                                dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                            >
                                <Picker.Item label='None' value={'None'} />
                                <Picker.Item label='Professional Workshop' value={'Professional'} />
                                <Picker.Item label='Academic Workshop' value={'Academic'} />
                            </Picker>
                        </View>
                    }

                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Associated Committee</Text>
                    <Picker
                        selectedValue={committee}
                        onValueChange={(selectedCommittee: string) => {
                            setCommittee(selectedCommittee);
                        }}
                        style={{ color: darkMode ? "white" : "black" }}
                        selectionColor={darkMode ? "#FFF4" : "0004"}
                        itemStyle={{
                            color: darkMode ? "white" : "black"
                        }}
                        dropdownIconColor={darkMode ? "#ffffff" : "#000000"}
                    >
                        <Picker.Item label='None' value={undefined} />
                        {selectableCommittees.map((item, index) => (
                            <Picker.Item key={`item.name ${index}`} label={item.name} value={item.firebaseDocName} />
                        ))}
                    </Picker>

                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Location Name</Text>
                    <TextInput
                        className={`text-lg p-2 rounded mb-4 ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                        value={locationName}
                        placeholder='Where is this event?'
                        placeholderTextColor={darkMode ? "#DDD" : "#777"}
                        onChangeText={(text) => setLocationName(text)}
                        keyboardType='ascii-capable'
                        autoFocus
                        enterKeyHint='enter'
                    />
                    <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Enable Geofencing</Text>
                    <View className='flex flex-row'>
                        <Switch
                            value={geofencingEnabled}
                            onValueChange={(value) => setGeofencingEnabled(value)}
                        />
                    </View>
                    {
                        geofencingEnabled ?
                            <TouchableOpacity
                                className={`text-lg p-2 rounded mb-4 ${darkMode ? "bg-zinc-700" : "bg-zinc-200"}`}
                                onPress={() => setShowLocationPicker(true)}
                            >
                                {!locationDetails ?
                                    <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>
                                        No Location Selected
                                    </Text> :
                                    <View className='flex flex-row'>
                                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{locationDetails.address_components[0].long_name} </Text>
                                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{locationDetails.address_components[1].long_name}, </Text>
                                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{locationDetails.address_components[2].long_name} </Text>
                                    </View>
                                }
                            </TouchableOpacity> :
                            <Text className={`text-lg p-2 rounded mb-4 ${darkMode ? "text-white bg-zinc-700" : "text-gray-400 bg-zinc-300"}`}>
                                No Location Selected
                            </Text>
                    }
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
                                    committee,
                                });
                                if (geofencingEnabled) {
                                    event.copyFromObject({
                                        geolocation,
                                        geofencingRadius
                                    })
                                }
                                navigation.navigate("FinalizeEvent", { event: event });
                            }

                        }}
                    />
                    <Text className={`text-xl text-center pt-2 ${darkMode ? "text-white" : "text-black"}`}>Step 3 of 4</Text>
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

export default SetSpecificEventDetails;
