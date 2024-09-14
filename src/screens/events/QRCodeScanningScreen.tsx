import { View, Text, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, PinchGestureHandler, PinchGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { MainStackParams } from '../../types/navigation';
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const QRCodeScanningScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const [hasCameraPermissions, setHasCameraPermissions] = useState<boolean | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [qrData, setQrData] = useState<{ id: string; mode: string } | null>(null);
    const cameraRef = useRef<CameraView>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const dataRegex: RegExp = /^tamu-shpe:\/\/event\?id=[a-zA-z0-9]+&mode=(sign-in|sign-out)$/i;

        if (dataRegex.test(data)) {
            const linkVariables = data.split('?')[1].split('&');
            const id = linkVariables[0].split('=')[1];
            const mode = linkVariables[1].split('=')[1];
            if (id && (mode === 'sign-in' || mode === 'sign-out')) {
                setQrData({ id, mode });

                // Clear any existing timeout when valid data is found
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                // Set a timeout to clear qrData after 3 seconds if no new valid QR codes are detected
                timeoutRef.current = setTimeout(() => {
                    setQrData(null);
                }, 5000);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleConfirm = () => {
        if (qrData) {
            navigation.navigate("EventVerificationScreen", { id: qrData.id, mode: qrData.mode as "sign-in" | "sign-out" });
            setQrData(null);
        }
    };


    if (hasCameraPermissions === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasCameraPermissions === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <GestureHandlerRootView>
            <SafeAreaView className='flex flex-col h-full w-screen bg-primary-blue'>
                {/* Header */}
                <View className={`flex-row items-center mb-4 bg-primary-blue`}>
                    <View className='w-screen absolute'>
                        <Text className={`text-2xl font-bold justify-center text-center text-white`}>Scanner</Text>
                    </View>
                    <TouchableOpacity className='px-6' onPress={() => navigation.goBack()}>
                        <Octicons name="x" size={24} color="white" />
                    </TouchableOpacity>
                </View>


                <CameraView
                    onBarcodeScanned={handleBarCodeScanned}
                    ref={cameraRef}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "pdf417"],
                    }}
                    className='flex-1'
                >
                    {/* Pulsing Effect */}
                    <View className="flex justify-center items-center h-full">
                        <Animated.View className="flex justify-center items-center" style={{ transform: [{ scale: pulseAnim }] }}>
                            <View className='w-60 h-60'>
                                <View
                                    className={`absolute top-0 left-0 w-11 h-11 border-t-4 border-l-4 rounded-tl-lg ${qrData ? 'border-primary-orange' : 'border-white'}`}
                                />
                                <View
                                    className={`absolute top-0 right-0 w-11 h-11 border-t-4 border-r-4 rounded-tr-lg ${qrData ? 'border-primary-orange' : 'border-white'}`}
                                />
                                <View
                                    className={`absolute bottom-0 left-0 w-11 h-11 border-b-4 border-l-4 rounded-bl-lg ${qrData ? 'border-primary-orange' : 'border-white'}`}
                                />
                                <View
                                    className={`absolute bottom-0 right-0 w-11 h-11 border-b-4 border-r-4 rounded-br-lg ${qrData ? 'border-primary-orange' : 'border-white'}`}
                                />
                            </View>
                        </Animated.View>
                    </View>

                    {/* Button for Sign In/Sign Out */}
                    {qrData && (
                        <View className='absolute w-full bottom-0 mb-5 z-50 justify-center items-center'>
                            <TouchableOpacity
                                onPress={handleConfirm}
                                className="px-4 py-1 items-center justify-center rounded-lg mx-4 bg-primary-orange"
                            >
                                <Text className='text-center text-white text-xl'>
                                    {qrData.mode === 'sign-in' ? 'Sign in to the event' : 'Sign out of the event'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </CameraView>

                <View className='my-2'>
                    <Text className='text-white text-center font-bold text-xl'>Using Scanner</Text>
                    <Text className='text-white text-center text-lg'>Scan the QRCode provided by the event host.</Text>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

export default QRCodeScanningScreen;
