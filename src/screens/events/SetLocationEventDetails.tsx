import { View, Text, TouchableOpacity, TextInput, useColorScheme } from 'react-native'
import React, { useContext, useState } from 'react'
import { EventProps, UpdateEventScreenRouteProp } from '../../types/navigation'
import { useRoute } from '@react-navigation/core';
import { UserContext } from '../../context/UserContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { GeoPoint } from 'firebase/firestore';
import LocationPicker from '../../components/LocationPicker';
import InteractButton from '../../components/InteractButton';


const SetLocationEventDetails = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [locationName, setLocationName] = useState<string | undefined>(event.locationName ?? undefined);
    const [geolocation, setGeolocation] = useState<GeoPoint | undefined>(event.geolocation ?? undefined);
    const [geofencingRadius, setGeofencingRadius] = useState<number | undefined>(event.geofencingRadius ?? undefined);

    return (
        <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Header */}
            <View className='flex-row items-center'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Location Details</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            {/* Location Name */}
            <View className='mt-3 mx-4 pb-6'>
                <Text className={`mb-1 text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                    Location Name<Text className='text-[#f00]'>*</Text>
                </Text>

                <TextInput
                    className={`text-lg p-2 rounded border border-1 border-black ${darkMode ? "text-white bg-secondary-bg-dark" : "text-black bg-secondary-bg-light"}`}
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


            <View className='w-full absolute bottom-0 mb-24'>
                <InteractButton
                    buttonClassName='bg-primary-blue py-1 rounded-xl mx-4'
                    textClassName='text-center text-white text-2xl font-bold'
                    label='Preview Event'
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
                <View
                    className="mt-1 mx-4 rounded-md py-2 justify-center items-center"
                    style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}
                >
                    <Text style={{ color: darkMode ? 'white' : 'black' }}>Location details can be changed later</Text>
                </View>
            </View>
        </SafeAreaView>
    );

}

export default SetLocationEventDetails