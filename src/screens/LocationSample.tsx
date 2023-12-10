import { View, TextInput, Button, Modal, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import MapView, { Marker, Circle } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';


const LocationSample = () => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject>();
    const [address, setAddress] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [eventLocation, setEventLocation] = useState<Location.LocationGeocodedLocation>();
    const [eventDetails, setEventDetails] = useState<Location.LocationGeocodedAddress>();
    const [isUserNear, setIsUserNear] = useState<boolean>(false);
    const [draggableMarkerCoord, setDraggableMarkerCoord] = useState<Coordinate>();
    const [prevMarkerCoord, setPrevMarkerCoord] = useState<Coordinate>();
    const [radius, setRadius] = useState(100);

    const initialCoordinate = { latitude: 30.621160236499136, longitude: -96.3403560168198 }

    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Get Permission and Set Location
        const getPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status != 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setUserLocation(currentLocation);
        }

        getPermission()
    }, [])

    // [Geofencing Code]
    const getDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    // [GeoFencing Code]
    const isWithinRegion = (userLocation: Location.LocationObject, eventLocation: Location.LocationGeocodedLocation) => {
        console.log(userLocation.coords.latitude, userLocation.coords.longitude)
        console.log(eventLocation.latitude, eventLocation.longitude)
        const distance = getDistanceBetweenPoints(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            eventLocation.latitude,
            eventLocation.longitude
        );
        const Tol = 20;
        setIsUserNear(distance < radius + 20);
    };


    // [Event Location Setting]
    const searchLocation = async () => {
        if (address === '') { return; }
        const geocodedLocation = await Location.geocodeAsync(address)
        if (geocodedLocation.length === 0) { return; }

        setEventLocation(geocodedLocation[0])
        isWithinRegion(userLocation!, geocodedLocation[0]);
        console.log(geocodedLocation[0])

        const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
            longitude: geocodedLocation[0].longitude,
            latitude: geocodedLocation[0].latitude
        });

        setEventDetails(reverseGeocodedAddress[0]);


        // This will set marker for map for more precise location setting if user needs it
        setDraggableMarkerCoord({ longitude: geocodedLocation[0].longitude, latitude: geocodedLocation[0].latitude })
        setPrevMarkerCoord({ longitude: geocodedLocation[0].longitude, latitude: geocodedLocation[0].latitude })
    }



    return (
        <View className='flex-1 justify-center items-center'>
            <TextInput placeholder='Address' value={address} onChangeText={setAddress} />
            <Button title="Search For Location" onPress={() => searchLocation()} />
            <Text>{eventDetails?.street}</Text>
            <Text>{eventDetails?.city}</Text>
            <Text>{eventDetails?.region}</Text>
            <Text>{eventDetails?.subregion}</Text>
            <Text>{eventDetails?.district}</Text>
            <Text>{eventDetails?.postalCode}</Text>

            <Button title="Check User is At Location" onPress={() => {
                if (userLocation && eventLocation)
                    isWithinRegion(userLocation!, eventLocation!);
            }} />

            {(userLocation && eventLocation) && (
                <Text>{isUserNear ? "Im Here" : "Im not there"}</Text>
            )}
            <Button title="Open Map" onPress={() => {
                setModalVisible(true)
                setPrevMarkerCoord(draggableMarkerCoord);
            }}
            />


            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}

            >
                <View
                    className="flex-1 justify-center items-center"
                    style={{ paddingBottom: insets.bottom + 40 }}
                >
                    <MapView
                        // provider={PROVIDER_GOOGLE}
                        className='w-[100%] h-[80%]'
                        initialRegion={{
                            latitude: draggableMarkerCoord?.latitude || initialCoordinate.latitude,
                            latitudeDelta: 0.0922,
                            longitude: draggableMarkerCoord?.longitude || initialCoordinate.longitude,
                            longitudeDelta: 0.0421,
                        }}
                    >
                        <Marker
                            draggable
                            pinColor='#500000'
                            coordinate={draggableMarkerCoord || initialCoordinate}
                            onDragEnd={(e) => setDraggableMarkerCoord(e.nativeEvent.coordinate)}
                        />
                        <Circle
                            center={draggableMarkerCoord || initialCoordinate}
                            radius={radius}
                            fillColor="rgba(128, 128, 128, 0.3)"
                            strokeColor="rgba(128, 128, 128, 0.5)"
                            strokeWidth={1}
                        />
                    </MapView>
                    <View className='bg-white py-4 rounded-md m-2'>
                        <Text>Longitude: {draggableMarkerCoord?.longitude.toFixed(4)}</Text>
                        <Text>Latitude: {draggableMarkerCoord?.latitude.toFixed(4)}</Text>
                    </View>
                    <Button title="Set Location"
                        onPress={async () => {
                            setModalVisible(false)
                            setPrevMarkerCoord(draggableMarkerCoord);

                            setEventLocation(draggableMarkerCoord)
                            isWithinRegion(userLocation!, draggableMarkerCoord!);

                            const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
                                longitude: draggableMarkerCoord?.longitude || initialCoordinate.longitude,
                                latitude: draggableMarkerCoord?.latitude || initialCoordinate.latitude
                            });

                            setEventDetails(reverseGeocodedAddress[0]);
                        }} />
                    <Button title="Close Map"
                        onPress={() => {
                            setModalVisible(false)
                        }} />
                    <Button title="Reset Marker"
                        onPress={() => {
                            setDraggableMarkerCoord(prevMarkerCoord);
                        }} />
                    <Text>Radius: {radius}</Text>
                    <Slider
                        style={{ width: 200, height: 40 }}
                        minimumValue={50}
                        maximumValue={300}
                        value={radius}
                        onValueChange={(value) => setRadius(value)}
                    />
                </View>
            </Modal>
        </View>
    )
}

interface Coordinate {
    latitude: number;
    longitude: number;
}
export default LocationSample