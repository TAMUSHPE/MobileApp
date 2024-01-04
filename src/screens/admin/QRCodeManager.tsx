import { View, Text, Alert, Platform, ActivityIndicator } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { QRCodeProps, QRCodeScreenRouteProp } from '../../types/Navigation'
import { useRoute } from '@react-navigation/core';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Button, ToastAndroid } from 'react-native';
import * as Sharing from 'expo-sharing';
import { ScrollView } from 'react-native';


const QRCodeManager = ({ navigation }: QRCodeProps) => {
    const route = useRoute<QRCodeScreenRouteProp>();
    const { event } = route.params;
    const [loading, setLoading] = useState<boolean>(false);

    const signInQRCodeRef = useRef<any>(null);
    const signOutQRCodeRef = useRef<any>(null);

    const saveSignInQRCode = async () => {
        if (signInQRCodeRef.current) {
            try {
                setLoading(true);
                signInQRCodeRef.current.toDataURL(async (data: string) => {
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

    const saveSignOutQRCode = async () => {
        if (signInQRCodeRef.current) {
            try {
                setLoading(true);
                signInQRCodeRef.current.toDataURL(async (data: string) => {
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
                <ScrollView>
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
                            {
                                typeof event.signInPoints == "number" &&
                                <View className='my-4'>
                                    <Text className='text-2xl text-center'>Sign In QR Code</Text>
                                    <QRCode
                                        getRef={(c: any) => (signInQRCodeRef.current = c)}
                                        size={300}
                                        value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                                    />
                                    <View className='my-2'>
                                        <Button title="Save QR Code" onPress={saveSignInQRCode} />
                                    </View>
                                </View>
                            }
                            {
                                typeof event.signOutPoints == "number" &&
                                <View className='border border-t-2 border-x-0 border-b-0 border-gray-400 py-4'>
                                    <Text className='text-2xl text-center'>Sign Out QR Code</Text>
                                    <QRCode
                                        getRef={(c: any) => (signOutQRCodeRef.current = c)}
                                        size={300}
                                        value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                                    />
                                    <View className='my-2'>
                                        <Button title="Save QR Code" onPress={saveSignInQRCode} />
                                    </View>
                                </View>
                            }
                            {loading && <ActivityIndicator size="large" color="#0000ff" />}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}


export default QRCodeManager;