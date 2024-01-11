import { View, Text } from 'react-native';
import React, { useState } from 'react';
import DismissibleModal from './DismissibleModal';

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY

const LocationPicker = ({ visible, setVisible }: { visible: boolean, setVisible: (arg: boolean) => void, }) => {

    const [draggableMarkerCoord, setDraggableMarkerCoord] = useState();

    return (
        <DismissibleModal
            visible={visible}
            setVisible={setVisible}
        >
            <Text>LocationPicker</Text>
        </DismissibleModal>
    );
};

export default LocationPicker;