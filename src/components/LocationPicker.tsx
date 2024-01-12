import { View, Text, Modal, TouchableHighlight, Platform, Button } from 'react-native';
import React, { useEffect, useState } from 'react';
import { GooglePlacesAutocomplete, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import MapView, { Marker, Circle, LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location'
import { GooglePlacesApiKey, presetLocationList, reverseGeocode } from '../helpers/geolocationUtils';
import Slider from '@react-native-community/slider';
import { handleLinkPress } from '../helpers/links';

const initialCoordinate = { latitude: 30.621160236499136, longitude: -96.3403560168198 } // Zachary Engineering Education Complex
const initialMapDelta = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 } // Size of map view

const LocationPicker = ({ visible, setVisible, onLocationChange }: { visible: boolean, setVisible: (visible: boolean) => void, onLocationChange: (locationDetails: GooglePlaceDetail | undefined | null, radius: number) => void }) => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject>();
    const [locationDetails, setLocationDetails] = useState<GooglePlaceDetail | null>();
    const [draggableMarkerCoord, setDraggableMarkerCoord] = useState<LatLng>(initialCoordinate);
    const [mapRegion, setMapRegion] = useState<Region>({ ...initialCoordinate, ...initialMapDelta });
    const [radius, setRadius] = useState<number>(100);

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

    return (
        <Modal
            visible={visible}
        >
            <View className='flex flex-col w-screen h-full'>
                {/* Search Box for to search using Google Places */}
                <View className="absolute top-12 z-10 p-3 w-full">
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
                        }}
                        fetchDetails={true}
                        predefinedPlaces={presetLocationList}
                        onFail={(error) => console.error(error)}
                    />
                </View>

                <MapView
                    className='flex-1'
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
                    <Circle
                        center={draggableMarkerCoord}
                        radius={radius}
                        fillColor="rgba(128, 128, 128, 0.3)"
                        strokeColor="rgba(128, 128, 128, 0.5)"
                        strokeWidth={1}
                    />
                    {userLocation &&
                        <Marker
                            pinColor='#005'
                            coordinate={{
                                latitude: userLocation.coords.latitude,
                                longitude: userLocation.coords.longitude
                            }}
                        />
                    }
                </MapView>

                {/* Event Street Name, Radius Adjustment Slider */}
                <View className="absolute bottom-0 w-full p-3 pb-10 items-center bg-white">
                    {locationDetails?.address_components && (
                        <View className='flex-row space-x-2'>
                            <Text>{locationDetails.address_components[0].long_name}</Text>
                            <Text>{locationDetails.address_components[1].long_name}</Text>
                            <Text>{locationDetails.address_components[2].long_name}</Text>
                        </View>
                    )}
                    <Text>Radius: {radius.toFixed(2)} m</Text>
                    <Slider
                        style={{ width: 200, height: 40 }}
                        minimumValue={40}
                        maximumValue={200}
                        value={radius}
                        onValueChange={(value) => setRadius(value)}
                    />
                    {locationDetails?.geometry.location && (
                        <View className='flex flex-row mb-4'>
                            {Platform.OS == "ios" && (
                                <Button
                                    title="Open in Apple Maps"
                                    onPress={() => {
                                        const { lat, lng } = locationDetails.geometry.location;
                                        handleLinkPress(`http://maps.apple.com/?ll=${lat},${lng}`);
                                    }}
                                />
                            )}

                            <Button
                                title="Open in Google Maps"
                                onPress={() => {
                                    const { lat, lng } = locationDetails.geometry.location;
                                    handleLinkPress(`https://www.google.com/maps?q=${lat},${lng}`);
                                }}
                            />
                        </View>
                    )}
                    <Button
                        title="Select This Location"
                        color='#F53200'
                        onPress={() => {
                            setVisible(false);
                            onLocationChange(locationDetails, radius);
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default LocationPicker;