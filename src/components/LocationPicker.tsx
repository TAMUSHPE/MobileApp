import { View, Text, Switch } from 'react-native';
import React, { useEffect, useState } from 'react';
import { GooglePlacesAutocomplete, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import MapView, { Marker, Circle, LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location'
import { GooglePlacesApiKey, presetLocationList, reverseGeocode } from '../helpers/geolocationUtils';
import Slider from '@react-native-community/slider';
import { TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';

const initialCoordinate = { latitude: 30.621160236499136, longitude: -96.3403560168198 } // Zachary Engineering Education Complex
const initialMapDelta = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 } // Size of map view

const LocationPicker = ({ onLocationChange }: {
    onLocationChange: (locationDetails: GooglePlaceDetail | undefined | null, radius: number | undefined) => void
}) => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject>();
    const [locationDetails, setLocationDetails] = useState<GooglePlaceDetail | null>();
    const [draggableMarkerCoord, setDraggableMarkerCoord] = useState<LatLng>(initialCoordinate);
    const [mapRegion, setMapRegion] = useState<Region>({ ...initialCoordinate, ...initialMapDelta });
    const [initialRadius, setInitialRadius] = useState<number>(100);
    const [radius, setRadius] = useState<number>();
    const [geofencingEnabled, setGeofencingEnabled] = useState<boolean>(false);

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

            {/* Search Box for to search using Google Places */}
            <View className="absolute z-10 p-3 w-full top-11">
                <View className='w-full'>
                    <GooglePlacesAutocomplete
                        placeholder="Search"
                        query={{
                            key: GooglePlacesApiKey,
                            language: 'en',
                        }}
                        onPress={(data, details = null) => {
                            if (details === null) {
                                alert("There was a problem searching for that location. Please try again.")
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
                                ...initialMapDelta
                            });
                            setLocationDetails(details);
                        }}
                        fetchDetails={true}
                        predefinedPlaces={presetLocationList}
                        onFail={(error) => console.error(error)}
                    />

                </View>

                <View className='flex-row'>
                    <TouchableOpacity
                        className='h-12 w-12 items-center justify-center bg-pale-blue rounded-md'
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
                    {geofencingEnabled && (
                        <View className='flex-1 ml-2 bg-white rounded-md px-4 pt-1'>
                            <View className='flex-1'>
                                <Slider
                                    minimumValue={40}
                                    maximumValue={200}
                                    value={radius}
                                    onValueChange={(value) => {
                                        setInitialRadius(value);
                                        setRadius(value)
                                    }}
                                    minimumTrackTintColor="#72A9BE"
                                />
                            </View>
                        </View>
                    )}
                </View>

            </View>

            {/* Radius Adjustment Slider */}
            <View className="absolute top-0 w-full px-6 pb-2 bg-white">
                <View className='flex-row items-center'>
                    <Text className='text-gray-500 text-lg'>Area Restriction</Text>
                    <Switch
                        className='ml-2'
                        trackColor={{ false: "#767577", true: "#72A9BE" }}
                        value={geofencingEnabled}
                        onValueChange={(value) => {
                            setGeofencingEnabled(value)
                            if (value) {
                                setRadius(initialRadius);
                            } else {
                                setRadius(undefined);
                            }
                        }}
                    />
                </View>
            </View>
        </View>
    );
};

export default LocationPicker;