import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef } from 'react'
import * as MediaLibrary from 'expo-media-library';
import { useRoute } from '@react-navigation/core';
import QRCode from "react-qr-code";
import ViewShot from "react-native-view-shot";
import RNFS from 'react-native-fs';
import { EventVerificationProps, EventVerificationScreenRouteProp } from '../types/Navigation'
import Constants, { ExecutionEnvironment } from 'expo-constants';
const EventVerification = ({ navigation }: EventVerificationProps) => {


    const [status, requestPermission] = MediaLibrary.usePermissions();
    const viewShotRef = useRef<ViewShot>(null);
    const route = useRoute<EventVerificationScreenRouteProp>();
    const { id } = route.params;

    useEffect(() => {
        if (status === null) {
            requestPermission();
        }
    }, [status])

    const onImageDownload = async () => {
        const uri = await viewShotRef.current?.capture?.();
        if (uri) {
            const filePath = `${RNFS.DocumentDirectoryPath}/QRCode.png`;

            RNFS.moveFile(uri, filePath)
                .then(() => {
                    console.log("Image saved to", filePath);
                    MediaLibrary.saveToLibraryAsync(filePath)
                })
                .catch((err) => {
                    console.error("Failed to save image:", err);
                });
        } else {
            console.error("Failed to capture the QRCode");
        }
    };


    return (
        <View>
            <Text>Event: {id} </Text>
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
                <QRCode value="tamu-shpe://event?id=123" />
            </ViewShot>
            <TouchableOpacity onPress={onImageDownload}>
                <Text>Download QRCode</Text>
            </TouchableOpacity>
        </View>
    )
}

export default EventVerification