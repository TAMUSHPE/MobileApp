import { View, TextInput, Button } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as Location from 'expo-location'

const LocationSample = () => {
    const [location, setLocation] = useState<Location.LocationObject>();
    const [address, setAddress] = useState<string>('');
    const [eventLocation, setEventLocation] = useState<Location.LocationGeocodedLocation>();

    useEffect(() => {
        const getPermission = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status != 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        }

        getPermission()
    }, [])

    const getDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        console.log(lat1, lon1, lat2, lon2, " test")
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

    const isWithinRegion = (userLocation: Location.LocationObject, eventLocation: Location.LocationGeocodedLocation) => {
        const distance = getDistanceBetweenPoints(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            eventLocation.latitude,
            eventLocation.longitude
        );

        console.log(distance) // in meters
        return distance < 100;
    };

    // Set Event Location
    const geocode = async () => {
        const geocodedLocation = await Location.geocodeAsync(address)
        console.log(address)
        console.log(geocodedLocation[0])
        setEventLocation(geocodedLocation[0])
    }

    return (
        <View>
            <TextInput placeholder='Address' value={address} onChangeText={setAddress} />
            <Button title="Geocode Address" onPress={() => geocode()} />
            <Button title="Check User is At Location" onPress={() => {
                console.log(location?.coords.latitude, location?.coords.longitude, "user location")
                console.log(eventLocation?.latitude, eventLocation?.longitude, "event location")
                const isUserHere = isWithinRegion(location!, eventLocation!);
                console.log(isUserHere, "is user here")
            }} />

        </View>
    )
}

export default LocationSample