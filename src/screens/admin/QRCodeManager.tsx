import { View, Text, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useRef } from 'react'
import { QRCodeProps, QRCodeScreenRouteProp } from '../../types/Navigation'
import { useRoute } from '@react-navigation/core';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Button } from 'react-native';
import * as Sharing from 'expo-sharing';
import DismissibleModal from '../../components/DismissibleModal';


const QRCodeManager = ({ navigation }: QRCodeProps) => {
    const route = useRoute<QRCodeScreenRouteProp>();
    const { event } = route.params;
    const [loading, setLoading] = useState<boolean>(false);

    const signInQRCodeRef = useRef<any>(null);
    const signOutQRCodeRef = useRef<any>(null);

    const [showSignInModal, setSignInModal] = useState<boolean>(false);
    const [showSignOutModal, setSignOutModal] = useState<boolean>(false);

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
        if (signOutQRCodeRef.current) {
            try {
                setLoading(true);
                signOutQRCodeRef.current.toDataURL(async (data: string) => {
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

    const displaySignInQRCode = async () => {
        
    }

    return (
        <GestureHandlerRootView>
            <SafeAreaView>
                <View>
                    <View className='flex-row items-center h-10'>                        
                        <View className='pl-6'>
                            <TouchableOpacity className="pr-4" onPress={() => {
                                navigation.goBack();
                            }}>
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
                            {
                                typeof event.signInPoints == "number" &&
                                <View className='my-4 border-pale-blue border-2 rounded-md'style={{borderWidth: 1, padding: 5, width: 300, height: 80}}>
                                   <TouchableOpacity onPress={() => setSignInModal(true)} style={{ flexDirection: 'row', alignItems: 'center'}}>
                                        <View className='my-4 flex-row items-center' style={{marginRight: 5}}>
                                            <Text className='text-2xl text-center font-bold text-pale-blue'>Sign In QR Code</Text>
                                        </View>
                                        <View style={{flex: 1, alignItems: 'flex-end', marginRight: 5}}>
                                            <QRCode
                                                getRef={(c: any) => (signInQRCodeRef.current = c)}
                                                size={60}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            }
                            {
                                typeof event.signOutPoints == "number" &&
                                <View className='my-4 border-pale-blue border-2 rounded-md' style={{borderWidth: 1, padding: 5, width: 300, height: 80}}>
                                   <TouchableOpacity onPress={() => setSignOutModal(true)} style={{ flexDirection: 'row', alignItems: 'center'}}>
                                        <View className='my-4 flex-row items-center' style={{marginRight: 5}}>
                                            <Text className='text-2xl text-center font-bold text-pale-blue'>Sign Out QR Code</Text>
                                        </View>
                                        <View style={{flex: 1, alignItems: 'flex-end', marginRight: 5}}>
                                            <QRCode
                                                getRef={(c: any) => (signOutQRCodeRef.current = c)}
                                                size={60}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            }
                            {loading && <ActivityIndicator size="large" color="#0000ff" />}
                        </View>
                    </View>
                </View>
                <DismissibleModal
                    visible={showSignInModal}
                    setVisible={setSignInModal}
                >
                    <View
                        className='flex opacity-100 bg-white rounded-md px-6 pt-2 pb-6'
                        style={{ minWidth: 350 }}
                    >
                        <Text className='text-2xl text-center pb-2'>Sign In QR Code</Text>
                        <QRCode
                            getRef={(c: any) => (signInQRCodeRef.current = c)}
                            size={350}
                            value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                        />
                        <View className='pt-2'>
                            <Button title="Save QR Code" onPress={saveSignInQRCode} />
                        </View>                
                    </View>

                </DismissibleModal>
                <DismissibleModal
                    visible={showSignOutModal}
                    setVisible={setSignOutModal}
                >
                    <View
                        className='flex opacity-100 bg-white rounded-md px-6 pt-2 pb-6'
                        style={{ minWidth: 350 }}
                    >
                        <Text className='text-2xl text-center pb-2'>Sign Out QR Code</Text>
                        <QRCode
                            // getRef={(c: any) => (signOutQRCodeRef.current = c)}
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
        
        
    )
}


export default QRCodeManager;