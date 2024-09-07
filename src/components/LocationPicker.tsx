import { View, Text, Switch, useColorScheme, Platform } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { GooglePlacesAutocomplete, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import MapView, { Marker, Circle, LatLng, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location'
import { GooglePlacesApiKey, presetLocationList, reverseGeocode } from '../helpers/geolocationUtils';
import Slider from '@react-native-community/slider';
import { TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

const zacharyCoords = { latitude: 30.621160236499136, longitude: -96.3403560168198 }
const initialMapDelta = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 } // Size of map view

const LocationPicker = ({ onLocationChange, initialCoordinate = zacharyCoords, initialRadius, containerClassName = "" }: {
    onLocationChange: (locationDetails: GooglePlaceDetail | undefined | null, radius: number | undefined) => void
    initialCoordinate?: LatLng,
    initialRadius?: number,
    containerClassName?: string
}) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [userLocation, setUserLocation] = useState<Location.LocationObject>();
    const [locationDetails, setLocationDetails] = useState<GooglePlaceDetail | null>();
    const [draggableMarkerCoord, setDraggableMarkerCoord] = useState<LatLng>(initialCoordinate);
    const [mapRegion, setMapRegion] = useState<Region>({ ...initialCoordinate, ...initialMapDelta });
    const [defaultRadius, setDefaultRadius] = useState<number>(100);
    const [radius, setRadius] = useState<number | undefined>(initialRadius);
    const [geofencingEnabled, setGeofencingEnabled] = useState<boolean>(initialRadius ? true : false);

    useEffect(() => {
        Location.requestForegroundPermissionsAsync()
            .then(async ({ status }) => {
                if (status == 'granted') {
                    let currentLocation = await Location.getCurrentPositionAsync();
                    setUserLocation(currentLocation);
                }
            });

        reverseGeocode(initialCoordinate)
            .then((result) => {
                setLocationDetails(result);
            });
    }, []);

    useEffect(() => {
        onLocationChange(locationDetails, radius);
    }, [locationDetails, radius]);

    return (
        <View className='flex-1'>
            <MapView
                // IOS devices will use apple maps
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                className='flex-1'
                region={mapRegion}
            >
                <Marker
                    draggable
                    pinColor='#500'
                    coordinate={draggableMarkerCoord}
                    onDragEnd={async (dragEvent) => {
                        const newCoord = dragEvent.nativeEvent.coordinate;
                        setDraggableMarkerCoord(newCoord);
                        const response = await reverseGeocode(newCoord);
                        setLocationDetails(response);
                    }}
                />

                {radius && (
                    <Circle
                        center={draggableMarkerCoord}
                        radius={radius}
                        fillColor="rgba(128, 128, 128, 0.3)"
                        strokeColor="rgba(128, 128, 128, 0.5)"
                        strokeWidth={1}
                    />
                )}
            </MapView>

            <View className={`absolute z-10 p-3 w-full top-0 ${containerClassName}`}>
                <View className='w-full flex-row items-center justify-center'>
                    {/* Search Box for Google Places */}
                    <View className='flex-1 relative z-20'>
                        <GooglePlacesAutocomplete
                            placeholder="Search"
                            query={{
                                key: GooglePlacesApiKey,
                                language: 'en',
                            }}
                            onPress={(data, details = null) => {
                                if (details === null) {
                                    alert("There was a problem searching for that location. Please try again.");
                                    return;
                                }

                                setLocationDetails(details);
                                setDraggableMarkerCoord({
                                    latitude: details.geometry.location.lat,
                                    longitude: details.geometry.location.lng,
                                });
                                setMapRegion({
                                    latitude: details.geometry.location.lat,
                                    longitude: details.geometry.location.lng,
                                    ...initialMapDelta,
                                });
                                setLocationDetails(details);
                            }}
                            fetchDetails={true}
                            predefinedPlaces={presetLocationList}
                            onFail={(error) => console.error(error)}
                            styles={{
                                textInputContainer: {
                                    backgroundColor: darkMode ? 'black' : 'white',
                                    borderRadius: 10,
                                    paddingHorizontal: 10,
                                },
                                textInput: {
                                    backgroundColor: darkMode ? 'black' : 'white',
                                    color: darkMode ? 'white' : 'black',
                                    borderRadius: 10,
                                    height: 40,
                                },
                                listView: {
                                    position: 'absolute',
                                    top: 50,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: darkMode ? 'black' : 'white',
                                    zIndex: 9999,
                                    borderRadius: 10,
                                },
                                row: {
                                    backgroundColor: darkMode ? 'black' : 'white',
                                    borderBottomWidth: 0.5,
                                    borderBottomColor: darkMode ? 'gray' : 'lightgray',
                                },
                                description: {
                                    color: darkMode ? 'white' : 'black',
                                },
                                predefinedPlacesDescription: {
                                    color: darkMode ? 'white' : 'black',
                                },
                            }}
                        />
                    </View>

                    <TouchableOpacity
                        className='h-12 w-12 items-center justify-center ml-4 bg-primary-blue rounded-md'
                        onPress={async () => {
                            if (userLocation?.coords.latitude && userLocation?.coords.longitude) {
                                setDraggableMarkerCoord({
                                    latitude: userLocation.coords.latitude,
                                    longitude: userLocation.coords.longitude,
                                });
                                setMapRegion({
                                    latitude: userLocation.coords.latitude,
                                    longitude: userLocation.coords.longitude,
                                    ...initialMapDelta
                                });

                                const response = await reverseGeocode({
                                    latitude: userLocation.coords.latitude,
                                    longitude: userLocation.coords.longitude,
                                });
                                setLocationDetails(response);
                            }
                        }} >
                        <Octicons name="location" size={26} color="white" />
                    </TouchableOpacity>
                </View>

                <View className='-z-20'>
                    {!geofencingEnabled && (
                        <View className={`flex-row items-center justify-between mt-4 w-full px-4 h-12 rounded-lg ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
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
                            <Text className={`flex-1 text-xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Area Restriction</Text>
                            <TouchableOpacity onPress={() => {
                                setGeofencingEnabled(true);
                                setRadius(defaultRadius);
                            }}>
                                <Text className='text-lg text-primary-blue font-semibold'>Enable</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {geofencingEnabled && (
                        <View className={`flex-1 rounded-md px-4 pt-1 mt-4 flex-row items-center ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}>
                            <View className='flex-1'>
                                <Slider
                                    minimumValue={0}
                                    maximumValue={200}
                                    value={radius}
                                    onValueChange={(value) => {
                                        setRadius(value)
                                        if (value === 0) {
                                            setRadius(undefined);
                                            setGeofencingEnabled(false);
                                        }
                                    }}
                                    minimumTrackTintColor="#1870B8"
                                />
                            </View>
                            <Text className={`text-lg ml-3 ${darkMode ? 'text-white' : 'text-black'}`}>{radius?.toFixed(0)} meters</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default LocationPicker;