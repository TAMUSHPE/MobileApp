import { LatLng } from 'react-native-maps';

// If this is undefined, it will not affect functionality, but will cause unexpected behavior in location selection.
export const GooglePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

/** Google Maps API coordinates (lat/lng). */
export type Coordinates = {
    /** Degrees from equator */
    lat: number;
    /** Degrees from prime meridian */
    lng: number;
};

export type PlaceGeometry = {
    location: Coordinates;
};

/** Location result from Google Geocoding / Places Details APIs. */
export type PlaceLocation = {
    formatted_address?: string;
    geometry: PlaceGeometry;
    place_id?: string;
    name?: string;
};

export type PresetPlace = {
    description: string;
    geometry: PlaceGeometry;
};

export const coordinatesFromLatLng = (coordinate: LatLng): Coordinates => ({
    lat: coordinate.latitude,
    lng: coordinate.longitude,
});

export const latLngFromCoordinates = (coordinates: Coordinates): LatLng => ({
    latitude: coordinates.lat,
    longitude: coordinates.lng,
});

export const getCoordinatesFromPlace = (
    place: PlaceLocation | null | undefined,
): Coordinates | undefined => {
    const { lat, lng } = place?.geometry?.location ?? {};
    if (lat == null || lng == null) {
        return undefined;
    }
    return { lat, lng };
};

/**
 * List of various locations that may be useful to keep track of
 */
export const presetLocationList: PresetPlace[] = [
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
 * Converts coordinates to a human readable address
 * @param coordinate Geographic coordinates
 * @returns Details related to selected location. null if no results were found.
 */
export const reverseGeocode = async (
    coordinate: LatLng,
): Promise<PlaceLocation | null | undefined> => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GooglePlacesApiKey}`,
        );
        const json = await response.json();

        if (json.results.length > 0) {
            return json.results[0] as PlaceLocation;
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
};
