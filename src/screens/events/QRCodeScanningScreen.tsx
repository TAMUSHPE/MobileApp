import { View, Text, Button, StyleSheet, TouchableHighlight, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParams } from '../../types/navigation';
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const QRCodeScanningScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const [hasCameraPermissions, setHasCameraPermissions] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermissions(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };

        pulse();
    }, [pulseAnim]);

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        console.log('Data Received', `Bar code with type ${type} and data ${data} has been scanned!`);
        setScanned(true);
        const dataRegex: RegExp = /^tamu-shpe:\/\/event\?id=[a-zA-z0-9]+&mode=(sign-in|sign-out)$/i;
        if (!dataRegex.test(data)) {
            Alert.alert("Invalid QR Code", "Either this QR Code is invalid or was misscanned. Please try again.", [
                {
                    text: 'ok',
                    onPress: () => {
                        setScanned(false);
                    }
                }
            ]);
        }
        else {
            const linkVariables = data.split('?')[1].split('&');
            const id = linkVariables[0].split('=')[1];
            const mode = linkVariables[1].split('=')[1];
            if (id && mode === 'sign-in' || mode === 'sign-out') {
                navigation.navigate("EventVerificationScreen", { id, mode });
            }
        }
    };

    if (hasCameraPermissions === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasCameraPermissions === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <SafeAreaView className='flex flex-col h-full w-screen bg-primary-blue'>
            {/* Header */}
            <View className={`flex-row items-center mb-4 bg-primary-blue`}>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center text-white`}>Scanner</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="x" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
                className='flex-1'
            >
                {/* Pulsing Effect */}
                <View className="flex justify-center items-center h-full">
                    <Animated.View className="flex justify-center items-center" style={{ transform: [{ scale: pulseAnim }] }}>
                        <View className='w-60 h-60'>
                            <View className='absolute top-0 left-0 w-11 h-11 border-t-4 border-l-4 border-white rounded-tl-lg' />
                            <View className='absolute top-0 right-0 w-11 h-11 border-t-4 border-r-4 border-white rounded-tr-lg' />
                            <View className='absolute bottom-0 left-0 w-11 h-11 border-b-4 border-l-4 border-white rounded-bl-lg' />
                            <View className='absolute bottom-0 right-0 w-11 h-11 border-b-4 border-r-4 border-white rounded-br-lg' />
                        </View>
                    </Animated.View>
                </View>
            </CameraView>

            <View className='my-2'>
                <Text className='text-white text-center font-bold text-xl'>Using Scanner</Text>
                <Text className='text-white text-center text-lg'>Scan the QRCode provided by the event host.</Text>
            </View>
        </SafeAreaView>
    );
};

export default QRCodeScanningScreen;