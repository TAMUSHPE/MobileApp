import { View, Text, Alert, ActivityIndicator, Button } from 'react-native';
import React, { useState, useRef } from 'react';
import { RouteProp, useRoute } from '@react-navigation/core';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DismissibleModal from '../../components/DismissibleModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/navigation';

const QRCodeManager: React.FC<QRCodeScreenRouteProp> = ({ route, navigation }) => {
    const { event } = route.params;
    const [loading, setLoading] = useState<boolean>(false);

    const signInQRCodeRef = useRef<QRCodeRef | null>(null);
    const signOutQRCodeRef = useRef<QRCodeRef | null>(null);

    const [showSignInModal, setSignInModal] = useState<boolean>(false);
    const [showSignOutModal, setSignOutModal] = useState<boolean>(false);

    const saveQRCode = async (qrRef: React.MutableRefObject<QRCodeRef | null>, type: string) => {
        if (qrRef.current) {
            try {
                setLoading(true);
                qrRef.current.toDataURL(async (data: string) => {
                    const currentDate = new Date().toISOString().replace(/[-:.]/g, '');
                    const sanitizedEventName = event.name?.replace(/[\/\\:\*\?"<>\|#]/g, '_');

                    const fileUri = `${FileSystem.documentDirectory}${currentDate}_${sanitizedEventName}_${type}.png`;

                    // Save to file
                    await FileSystem.writeAsStringAsync(fileUri, data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    // Check if file exists
                    const fileInfo = await FileSystem.getInfoAsync(fileUri);
                    if (fileInfo.exists) {
                        // Share the file
                        if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(fileUri);
                        }
                    }

                    setLoading(false);
                });
            } catch (error) {
                setLoading(false);
                console.error("An error occurred:", error);
                Alert.alert('Error', 'Something went wrong while saving the QR Code.');
            }
        }
    };

    const saveSignInQRCode = () => saveQRCode(signInQRCodeRef, 'sign-in');
    const saveSignOutQRCode = () => saveQRCode(signOutQRCodeRef, 'sign-out');

    return (
        <GestureHandlerRootView>
            <SafeAreaView>
                <View>
                    <View className='flex-row items-center h-10'>
                        <View className='pl-6'>
                            <TouchableOpacity className="pr-4" onPress={() => navigation.goBack()}>
                                <Octicons name="chevron-left" size={30} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='flex-row items-center'>
                        <View className='w-screen p-4'>
                            <Text className="text-2xl font-bold text-center">{event.name}</Text>
                        </View>
                    </View>

                    <View className='w-screen'>
                        <View className='justify-center items-center'>
                            {typeof event.signInPoints === 'number' && (
                                <View className='my-4 border-pale-blue border-2 rounded-md border-1 p-2 w-[75%] h-20'>
                                    <TouchableOpacity className="flex-row items-center" onPress={() => setSignInModal(true)}>
                                        <View className='my-4 flex-row items-center flex-1'>
                                            <Text className='text-2xl text-center font-bold text-pale-blue'>Sign In QR Code</Text>
                                        </View>
                                        <View>
                                            <QRCode
                                                getRef={(c) => { signInQRCodeRef.current = c; }}
                                                size={60}
                                                value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {typeof event.signOutPoints === 'number' && (
                                <View className='my-4 border-pale-blue border-2 rounded-md border-1 p-2 w-[75%] h-20'>
                                    <TouchableOpacity className="flex-row items-center" onPress={() => setSignOutModal(true)}>
                                        <View className='my-4 flex-row items-center flex-1'>
                                            <Text className='text-2xl text-center font-bold text-pale-blue'>Sign Out QR Code</Text>
                                        </View>
                                        <View>
                                            <QRCode
                                                getRef={(c) => { signOutQRCodeRef.current = c; }}
                                                size={60}
                                                value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {loading && <ActivityIndicator size="large" color="#0000ff" />}
                        </View>
                    </View>
                </View>

                <DismissibleModal visible={showSignInModal} setVisible={setSignInModal}>
                    <View className='flex opacity-100 bg-white rounded-md px-6 pt-2 pb-6' style={{ minWidth: 350 }}>
                        <Text className='text-2xl text-center pb-2'>Sign In QR Code</Text>
                        <QRCode
                            getRef={(c) => { signInQRCodeRef.current = c; }}
                            size={350}
                            value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                        />
                        <View className='pt-2'>
                            <Button title="Save QR Code" onPress={saveSignInQRCode} />
                        </View>
                    </View>
                </DismissibleModal>

                <DismissibleModal visible={showSignOutModal} setVisible={setSignOutModal}>
                    <View className='flex opacity-100 bg-white rounded-md px-6 pt-2 pb-6' style={{ minWidth: 350 }}>
                        <Text className='text-2xl text-center pb-2'>Sign Out QR Code</Text>
                        <QRCode
                            getRef={(c) => { signOutQRCodeRef.current = c; }}
                            size={350}
                            value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                        />
                        <View className='pt-2'>
                            <Button title="Save QR Code" onPress={saveSignOutQRCode} />
                        </View>
                    </View>
                </DismissibleModal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

type QRCodeScreenRouteProp = {
    route: RouteProp<EventsStackParams, 'QRCode'>;
    navigation: NativeStackNavigationProp<EventsStackParams, 'QRCode'>;
};


type QRCodeRef = { toDataURL: (callback: (data: string) => void) => void };

export default QRCodeManager;
