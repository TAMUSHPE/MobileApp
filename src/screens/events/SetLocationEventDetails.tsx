import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation'
import { useRoute } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import { GeoPoint } from 'firebase/firestore';
import LocationPicker from '../../components/LocationPicker';
import InteractButton from '../../components/InteractButton';


const SetLocationEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const [locationName, setLocationName] = useState<string | undefined>(event.locationName ?? undefined);
    const [geolocation, setGeolocation] = useState<GeoPoint | undefined>(event.geolocation ?? undefined);
    const [geofencingRadius, setGeofencingRadius] = useState<number | undefined>(event.geofencingRadius ?? undefined);

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
                    <View className='h-7 w-7 bg-pale-blue rounded-full items-center justify-center'>
                        <Octicons name="check" size={20} color="white" />
                    </View>
                    <Text className='text-pale-blue text-lg ml-1'>Specific</Text>
                </View>

                <View className='ml-3 h-[2px] w-5 bg-pale-blue' />

                <View className='flex-row items-center justify-center ml-1'>
                    <View className='h-7 w-7 bg-pale-blue  rounded-full' />
                    <Text className='text-pale-blue text-lg ml-1'>Location</Text>
                </View>
            </View>


            <View className='px-5'>
                <Text className={`text-base ${darkMode ? "text-gray-100" : "text-gray-500"}`}>Location Name</Text>
                <TextInput
                    className={`text-lg p-2 rounded mb-4 ${darkMode ? "text-white bg-zinc-700" : "text-black bg-zinc-200"}`}
                    value={locationName}
                    placeholder='Ex. Zach 420'
                    placeholderTextColor={darkMode ? "#DDD" : "#777"}
                    onChangeText={(text) => setLocationName(text)}
                    keyboardType='ascii-capable'
                    enterKeyHint='enter'
                />
            </View>

            <LocationPicker
                onLocationChange={(location, radius) => {
                    if (location?.geometry.location.lat && location?.geometry.location.lng) {
                        setGeolocation(new GeoPoint(location?.geometry.location.lat, location?.geometry.location.lng));
                    }
                    setGeofencingRadius(radius);
                }}
            />

            <View className='absolute bottom-24 right-0 mr-2 w-32'>
                <InteractButton
                    buttonClassName='bg-pale-blue rounded-xl py-1'
                    textClassName='text-center text-white text-lg font-bold'
                    label='Finalize Event'
                    onPress={() => {
                        if (event.copyFromObject) {
                            event.copyFromObject({
                                locationName,
                                geolocation,
                            })

                            if (geofencingRadius) {
                                event.copyFromObject({
                                    geofencingRadius,
                                })
                            }
                        }
                        navigation.navigate("FinalizeEvent", { event: event });
                    }}
                />
            </View>
        </SafeAreaView>
    );

}

export default SetLocationEventDetails