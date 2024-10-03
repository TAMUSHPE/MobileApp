import { View, Text, TouchableOpacity, Animated, Easing, Dimensions, PixelRatio, Platform } from 'react-native';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { CameraView, Camera, BarcodeBounds } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParams } from '../../types/navigation';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type BarCodeScannedResult = {
    type: string;
    data: string;
    bounds?: BarcodeBounds
};

const QRCodeScanningScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const [hasCameraPermissions, setHasCameraPermissions] = useState<boolean | null>(null);
    const [boxColor, setBoxColor] = useState('#FFFFFF');
    const [validScanned, setValidScanned] = useState<boolean>(false);
    const [zoom, setZoom] = useState(0);
    const [lastZoom, setLastZoom] = useState(0);
    
    const maxZoomFactor = 5;
    const maxExpoZoom = (Platform.OS === 'ios' ? 0.1 : 1);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const boxTop = useRef(new Animated.Value((screenHeight / 2) - 240)).current;
    const boxLeft = useRef(new Animated.Value((screenWidth / 2) - 120)).current;
    const boxWidth = useRef(new Animated.Value(240)).current;
    const boxHeight = useRef(new Animated.Value(240)).current;


    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermissions(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    useEffect(() => {
        const pulse = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        };
        pulse();
    }, []);

    const handleBarCodeScanned = ({ bounds, type, data }: BarCodeScannedResult) => {
        if (validScanned) {
            return;
        }

        const dataRegex = /^tamu-shpe:\/\/event\?id=[a-zA-Z0-9]+&mode=(sign-in|sign-out)$/i;
        if (dataRegex.test(data)) {
            setValidScanned(true);
            console.log('Data Received', `Bar code with type ${type} and data ${data} has been scanned!`);
            if (bounds) {
                setBoxColor('#FD652F');

                Animated.parallel([
                    Animated.timing(boxTop, {
                        toValue: bounds.origin.y,
                        duration: 90,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(boxLeft, {
                        toValue: bounds.origin.x,
                        duration: 90,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(boxWidth, {
                        toValue: bounds.size.width,
                        duration: 90,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(boxHeight, {
                        toValue: bounds.size.height,
                        duration: 90,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ]).start();
            }

            setTimeout(() => {
                const linkVariables = data.split('?')[1].split('&');
                const id = linkVariables[0].split('=')[1];
                const mode = linkVariables[1].split('=')[1];
                if (id && (mode === 'sign-in' || mode === 'sign-out')) {
                    navigation.navigate('EventVerificationScreen', { id, mode });
                }
            }, 500);
        }
    };

    const onPinch = useCallback(
        (event: { velocity: number; scale: number; }) => {
          const velocity = event.velocity / (Platform.OS === 'ios' ? 40 : 4);
          const outFactor = lastZoom * (Platform.OS === 'ios' ? 50 : 20);
    
          let newZoom =
            velocity > 0
              ? zoom + event.scale * velocity * (Platform.OS === 'ios' ? 0.01 : 25)
              : zoom - (event.scale * (outFactor || 1)) * Math.abs(velocity) * (Platform.OS === 'ios' ? 0.03 : 50);
    
          if (newZoom < 0) newZoom = 0;
          else if (newZoom > maxExpoZoom) newZoom = maxExpoZoom;
    
          setZoom(newZoom);
        },
        [zoom, setZoom, lastZoom, setLastZoom]
      );
    
      const onPinchEnd = useCallback(
        () => {
          setLastZoom(zoom);
        },
        [zoom, setLastZoom]
      );
    
      const pinchGesture = useMemo(
        () => Gesture.Pinch().onUpdate(onPinch).onEnd(onPinchEnd),
        [onPinch, onPinchEnd]
    );

    const getZoomText = useMemo(() => {
        const zoomFactor = (zoom / maxExpoZoom) * (maxZoomFactor - 1) + 1;
        return `${zoomFactor.toFixed(1)}x`;
    }, [zoom, maxZoomFactor]);

    const resetZoom = () => {
        const decrementZoom = () => {
            setZoom(prevZoom => {
                const newZoom = Math.max(prevZoom - (0.05 * zoom), 0);
                if (newZoom === 0) clearInterval(interval); 
                return newZoom;
            });
        };
    
        const interval = setInterval(decrementZoom, 5); 
    };

    if (hasCameraPermissions === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasCameraPermissions === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <SafeAreaView className='flex flex-col h-full w-screen bg-primary-blue'>
            <View className={`flex-row items-center mb-4 bg-primary-blue`}>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center text-white`}>Scanner</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()}>
                    <Octicons name="x" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <GestureHandlerRootView>
                <GestureDetector gesture={pinchGesture}>

                    <CameraView
                        onBarcodeScanned={handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr', 'pdf417'],
                        }}
                        className='flex-1'
                        zoom={zoom}
                    >
                        {/* Pulsing Effect with Animated Transition */}
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: boxTop,
                                left: boxLeft,
                                width: boxWidth,
                                height: boxHeight,
                                transform: [{ scale: pulseAnim }],
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <View className='w-full h-full'>
                                <View
                                    style={{ borderColor: boxColor }}
                                    className='absolute top-0 left-0 w-[20%] h-[20%] border-t-4 border-l-4 rounded-tl-lg'
                                />
                                <View
                                    style={{ borderColor: boxColor }}
                                    className='absolute top-0 right-0 w-[20%] h-[20%] border-t-4 border-r-4 rounded-tr-lg'
                                />
                                <View
                                    style={{ borderColor: boxColor }}
                                    className='absolute bottom-0 left-0 w-[20%] h-[20%] border-b-4 border-l-4 rounded-bl-lg'
                                />
                                <View
                                    style={{ borderColor: boxColor }}
                                    className='absolute bottom-0 right-0 w-[20%] h-[20%] border-b-4 border-r-4 rounded-br-lg'
                                />
                            </View>
                        </Animated.View>

                        {/* Circular button for displaying zoom and resetting zoom */}
                        <TouchableOpacity
                            onPress={resetZoom}
                            className="absolute bottom-10 self-center bg-black/50 rounded-full w-12 h-12 flex justify-center items-center"
                        >
                            <Text className='text-white text-center font-bold text-base'>{getZoomText}</Text>
                        </TouchableOpacity>

                    </CameraView>
                </GestureDetector>
            </GestureHandlerRootView>


            <View className='my-2'>
                <Text className='text-white text-center font-bold text-xl'>Using Scanner</Text>
                <Text className='text-white text-center text-lg'>Scan the QRCode provided by the event host.</Text>
            </View>
        </SafeAreaView>
    );
};

export default QRCodeScanningScreen;
