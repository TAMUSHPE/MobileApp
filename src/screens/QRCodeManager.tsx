import { View, Text, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useRef } from 'react'
import { QRCodeProps, QRCodeScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Button, ToastAndroid } from 'react-native';
import * as Sharing from 'expo-sharing';


const QRCodeManager = ({ navigation }: QRCodeProps) => {
    const route = useRoute<QRCodeScreenRouteProp>();
    const { event } = route.params;
    const [loading, setLoading] = useState<boolean>(false);

    const qrCodeRef = useRef<any>(null);

    const saveQRCode = async () => {
        if (qrCodeRef.current) {
            try {
                setLoading(true);
                qrCodeRef.current.toDataURL(async (data: string) => {
                    const currentDate = new Date().toISOString().replace(/[-:.]/g, '');
                    const sanitizedEventName = event.name?.replace(/[\/\\:\*\?"<>\|#]/g, '_');

                    const fileUri = FileSystem.documentDirectory + `${currentDate}_${sanitizedEventName}.png`;

                    // Save to file
                    await FileSystem.writeAsStringAsync(fileUri, data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    setLoading(false);
                    // Check if file exists
                    const fileInfo = await FileSystem.getInfoAsync(fileUri);
                    if (fileInfo.exists) {
                        // Share the file
                        if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(fileUri);
                        }
                    }
                });
            } catch (error) {
                console.error("An error occurred:", error);
                Alert.alert('Error', 'Something went wrong while saving the QR Code.');
            }
        }
    }

    return (
        <GestureHandlerRootView>
            <SafeAreaView>
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">{event.name} QRCode</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={() => {
                            navigation.goBack();
                        }}>
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='w-screen'>
                    <View className='justify-center items-center'>
                        <QRCode
                            getRef={(c: any) => (qrCodeRef.current = c)}
                            size={300}
                            value={`tamu-shpe://event?id=${event.id}`}
                        />
                        <Button title="Save QR Code" onPress={saveQRCode} />
                        {loading && <ActivityIndicator size="large" color="#0000ff" />}
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}


export default QRCodeManager;