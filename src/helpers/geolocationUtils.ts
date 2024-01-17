import { LatLng } from 'react-native-maps';
import { GooglePlaceDetail, Place } from 'react-native-google-places-autocomplete';

// If this is undefined, it will not affect functionality, but will cause unexpected behavior in location selection.
export const GooglePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

export type Coordinates = {
    /** Angle phi representing *degrees* from equator  */
    lat: number;
    /** Angle theta representing *degrees* from prime meridian */
    lng: number
}

/**
 * List of various locations that may be useful to keep track of
 */
export const presetLocationList: Place[] = [
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
    },
];

/**
 * Coverts coordinates to a human readable address 
 * @param coordinate Geographic coordinates
 * @returns Details related to selected location. null if no results were found.
 */
export const reverseGeocode = async (coordinate: LatLng): Promise<GooglePlaceDetail | undefined | null> => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GooglePlacesApiKey}`
        );
        const json = await response.json();

        if (json.results.length > 0) {
            const details = json.results;
            return details[0] as GooglePlaceDetail;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
};