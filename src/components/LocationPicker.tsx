import { View, Text, Switch } from 'react-native';
import React, { useEffect, useState } from 'react';
import { GooglePlacesAutocomplete, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import MapView, { Marker, Circle, LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location'
import { GooglePlacesApiKey, presetLocationList, reverseGeocode } from '../helpers/geolocationUtils';
import Slider from '@react-native-community/slider';
import { TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';

const zacharyCoords = { latitude: 30.621160236499136, longitude: -96.3403560168198 }
const initialMapDelta = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 } // Size of map view

const LocationPicker = ({ onLocationChange, initialCoordinate = zacharyCoords, initialRadius, containerClassName = "" }: {
    onLocationChange: (locationDetails: GooglePlaceDetail | undefined | null, radius: number | undefined) => void
    initialCoordinate?: LatLng,
    initialRadius?: number,
    containerClassName?: string
}) => {
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

            <View className={`absolute z-10 p-3 w-full top-0 ` + containerClassName}>
                <View className='w-full flex-row items-center justify-center'>
                    {/* Search Box for to search using Google Places */}
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

                <View>
                    {!geofencingEnabled && (
                        <View className='flex-row items-center justify-between mt-4 w-full px-4 bg-secondary-bg-light h-12 rounded-lg'
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
                            <Text className='flex-1 text-xl font-semibold'>Area Restriction</Text>
                            <TouchableOpacity onPress={() => {
                                setGeofencingEnabled(true);
                                setRadius(defaultRadius);
                            }}>
                                <Text className='text-lg text-primary-blue font-semibold '>Enable</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {geofencingEnabled && (
                        <View className='flex-1 bg-secondary-bg-light rounded-md px-4 pt-1 mt-4 flex-row items-center'>
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
                            <Text className='text-lg ml-3'>{radius?.toFixed(0)}m</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default LocationPicker;