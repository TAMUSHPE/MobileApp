import { View, Button, Text, Linking, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import MapView, { Marker, Circle, PROVIDER_GOOGLE, LatLng, Region } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { GooglePlacesAutocomplete, GooglePlaceDetail, Point } from 'react-native-google-places-autocomplete';

const LocationSample = () => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject>();
    const [eventDetails, setEventDetails] = useState<GooglePlaceDetail>();
    const [isAtEvent, seIsAtEvent] = useState<boolean>(false);

    const initialCoordinate = { latitude: 30.621160236499136, longitude: -96.3403560168198 } // Zachary Engineering Education Complex
    const [draggableMarkerCoord, setDraggableMarkerCoord] = useState<LatLng>(initialCoordinate);
    const [mapRegion, setMapRegion] = useState<Region>({
        ...initialCoordinate,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [radius, setRadius] = useState<number>(100); // in meters, set the area of the circle for event

    const GOOGLE_PLACES_API_KEY = 'AIzaSyAcvXABKc8AqQm5PJee0h-bd2Lh0oi5r-I';

    // preset location for autocomplete search box
    const presetLocation = [
        {
            description: 'Zachary Engineering Education Complex',
            geometry: { location: { lat: 30.621160236499136, lng: -96.3403560168198 } },
        },
        {
            description: 'Bryan Collegiate High School',
            geometry: { location: { lat: 30.65264295796464, lng: -96.34784907581891 } },
        },
        {
            description: 'Student Recreation Center',
            geometry: { location: { lat: 30.607092272291975, lng: -96.34283843216261 } },
        },
        {
            description: 'Richardson Petroleum Engineering Building',
            geometry: { location: { lat: 30.61935018435096, lng: -96.33930198511597 } },
        }
    ]

    useEffect(() => {
        // Get Permission and Set Location
        const getPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status != 'granted') {
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setUserLocation(currentLocation);
        }

        const fetchInitialLocation = async () => {
            const response = await reverseGeocode(initialCoordinate);
            setEventDetails(response);
        }

        getPermission()
        fetchInitialLocation()
    }, [])

    // From ChatGPT, need more testing
    const getDistanceBetweenPoints = (location1: LatLng, location2: Point) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = location1.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = location2.lat * Math.PI / 180;
        const Δφ = (location2.lat - location1.latitude) * Math.PI / 180;
        const Δλ = (location2.lng - location1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const isWithinRegion = (userLocation: Location.LocationObject, eventDetails: GooglePlaceDetail) => {
        const distance = getDistanceBetweenPoints(
            userLocation.coords,
            eventDetails.geometry.location
        );
        const Tol = 20;
        seIsAtEvent(distance < radius + 20);
    };


    const reverseGeocode = async (coordinate: LatLng) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_PLACES_API_KEY}`
            );
            const json = await response.json();

            if (json.results.length > 0) {
                const details = json.results;
                return details[0] as GooglePlaceDetail;
            } else {
                console.log("No results found");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLinkPress = async (url: string) => {
        if (!url) {
            console.warn(`Empty/Falsy URL passed to handleLinkPress(): ${url}`);
            return;
        }

        await Linking.canOpenURL(url)
            .then(async (supported) => {
                if (supported) {
                    await Linking.openURL(url)
                        .catch((err) => console.error(`Issue opening url: ${err}`));
                } else {
                    console.warn(`Don't know how to open this URL: ${url}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };


    return (
        <View className='flex-1'>
            <MapView
                className='flex-1'
                region={mapRegion}
            >
                <Marker
                    draggable
                    pinColor='#500000'
                    coordinate={draggableMarkerCoord}
                    onDragEnd={async (e) => {
                        const newCoord = e.nativeEvent.coordinate;
                        setDraggableMarkerCoord(newCoord);
                        const response = await reverseGeocode(newCoord);
                        setEventDetails(response);
                    }} />
                <Circle
                    center={draggableMarkerCoord}
                    radius={radius}
                    fillColor="rgba(128, 128, 128, 0.3)"
                    strokeColor="rgba(128, 128, 128, 0.5)"
                    strokeWidth={1}
                />
                {userLocation && (
                    <Marker
                        coordinate={{
                            latitude: userLocation.coords.latitude,
                            longitude: userLocation.coords.longitude
                        }}
                    />
                )}
            </MapView>

            <View className="absolute top-12 z-10 p-3 w-full">
                <GooglePlacesAutocomplete
                    placeholder="Search"
                    query={{
                        key: GOOGLE_PLACES_API_KEY,
                        language: 'en',
                    }}
                    onPress={(data, details = null) => {
                        if (details === null) {
                            alert("There was a problem searching for that location. Please try again.")
                            return;
                        }

                        setEventDetails(details);
                        setDraggableMarkerCoord({
                            latitude: details.geometry.location.lat,
                            longitude: details.geometry.location.lng,
                        });
                        setMapRegion({
                            latitude: details.geometry.location.lat,
                            longitude: details.geometry.location.lng,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        });
                    }}
                    fetchDetails={true}
                    predefinedPlaces={presetLocation}
                    onFail={(error) => console.error(error)}
                />
            </View>

            <View className="absolute bottom-0 w-full p-3 pb-10 items-center bg-white">
                <Text>Latitude: {draggableMarkerCoord.latitude.toFixed(4)}</Text>
                <Text>Longitude: {draggableMarkerCoord.longitude.toFixed(4)}</Text>

                {eventDetails?.address_components && (
                    <View>
                        {eventDetails.address_components.map((addr, index) => (
                            <Text key={index}>{addr.long_name}</Text>
                        ))}
                    </View>
                )}
                {eventDetails?.url && (
                    <View>
                        <Text>Open Link via URL from google API</Text>
                        <Button
                            title="Open in Google Maps"
                            onPress={() => handleLinkPress(eventDetails.url!)}
                        />
                    </View>
                )}
                {eventDetails?.geometry.location && (
                    <View>
                        <Text>Open Link via latitude and longitude </Text>
                        <Button
                            title="Open in Apple Maps"
                            onPress={() => {
                                const { lat, lng } = eventDetails.geometry.location;
                                handleLinkPress(`http://maps.apple.com/?ll=${lat},${lng}`);
                            }}
                        />

                        <Button
                            title="Open in Google Maps"
                            onPress={() => {
                                const { lat, lng } = eventDetails.geometry.location;
                                handleLinkPress(`https://www.google.com/maps?q=${lat},${lng}`);
                            }}
                        />
                    </View>

                )}

                <Text>Radius: {radius}</Text>
                <Slider
                    style={{ width: 200, height: 40 }}
                    minimumValue={50}
                    maximumValue={300}
                    value={radius}
                    onValueChange={(value) => setRadius(value)}
                />

                <Button
                    title="Check if user is near"
                    onPress={() => {
                        if (userLocation && eventDetails) {
                            isWithinRegion(userLocation, eventDetails);
                        }
                    }}
                />
                <Text>{isAtEvent ? "You are within range of the event" : "You are not within range of the event. You must be at the event to earn points."}</Text>
            </View>
        </View >
    );
};

export default LocationSample;