import { View, Text, Button, StyleSheet, TouchableHighlight, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParams } from '../../types/Navigation';
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const QRCodeScanningScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const [hasCameraPermissions, setHasCameraPermissions] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasCameraPermissions(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

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
        <SafeAreaView className='flex flex-col h-screen w-screen bg-black'>
            {/* Header */}
            <View className={`flex-row items-center h-10`}>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center text-white`}>Scan QR Code</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="x" size={30} color="white" />
                </TouchableOpacity>
            </View>
            <BarCodeScanner
                className='h-[50%] w-full'
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
                onBarCodeScanned={scanned ? () => { } : handleBarCodeScanned}
            />
        </SafeAreaView>
    );
};

export default QRCodeScanningScreen;