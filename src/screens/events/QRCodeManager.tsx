import { View, Text, Alert, ActivityIndicator, Button, useColorScheme } from 'react-native';
import React, { useState, useRef, useContext } from 'react';
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
import { UserContext } from '../../context/UserContext';

const QRCodeManager: React.FC<QRCodeScreenRouteProp> = ({ route, navigation }) => {
    const { event } = route.params;

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const signInQRCodeRef = useRef<QRCodeRef | null>(null);
    const signOutQRCodeRef = useRef<QRCodeRef | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [showSignInModal, setSignInModal] = useState<boolean>(false);
    const [showSignOutModal, setSignOutModal] = useState<boolean>(false);

    console.log(event.signInPoints);
    console.log(event.signOutPoints);

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
            <SafeAreaView className={`flex-1 ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                <View className='flex-row items-center h-10'>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={() => navigation.goBack()}>
                            <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='flex-row items-center'>
                    <View className='w-screen p-4'>
                        <Text className="text-2xl font-bold text-center" style={{ color: darkMode ? 'white' : 'black' }}>{event.name}</Text>
                    </View>
                </View>

                <View className='w-screen'>
                    <View className='justify-center items-center'>
                        {!event.signInPoints && !event.signOutPoints && (
                            <View>
                                <Text className='text-center text-2xl font-bold' style={{ color: darkMode ? 'white' : 'black' }}>No QR Codes Available</Text>
                            </View>
                        )}
                        {event.signInPoints !== null && event.signInPoints !== undefined && event.signInPoints >= 0 && (
                            <View
                                className={`my-4 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'} rounded-md border-1 p-2 w-[85%] h-20 px-5`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}
                            >
                                <TouchableOpacity className="flex-row items-center" onPress={() => setSignInModal(true)}>
                                    <View className='my-4 flex-row items-center flex-1'>
                                        <Text className='text-2xl text-center font-bold' style={{ color: darkMode ? 'white' : 'black' }}>Sign In QR Code</Text>
                                    </View>
                                    <View>
                                        <QRCode
                                            getRef={(c) => { signInQRCodeRef.current = c; }}
                                            size={60}
                                            value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                                            backgroundColor={darkMode ? '#121212' : '#fff'}
                                            color={darkMode ? '#fff' : '#000'}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                        {event.signOutPoints !== null && event.signOutPoints !== undefined && event.signOutPoints >= 0 && (
                            <View
                                className={`my-4 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'} rounded-md border-1 p-2 w-[85%] h-20 px-5`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}
                            >
                                <TouchableOpacity className="flex-row items-center" onPress={() => setSignOutModal(true)}>
                                    <View className='my-4 flex-row items-center flex-1'>
                                        <Text className='text-2xl text-center font-bold' style={{ color: darkMode ? 'white' : 'black' }}>Sign Out QR Code</Text>
                                    </View>
                                    <View>
                                        <QRCode
                                            getRef={(c) => { signOutQRCodeRef.current = c; }}
                                            size={60}
                                            value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                                            backgroundColor={darkMode ? '#121212' : '#fff'}
                                            color={darkMode ? '#fff' : '#000'}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                        {loading && <ActivityIndicator size="small" color={darkMode ? "#fff" : "#0000ff"} />}
                    </View>
                </View>

                <DismissibleModal visible={showSignInModal} setVisible={setSignInModal}>
                    <View className={`flex opacity-100 rounded-md px-6 pt-2 pb-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-white'}`} style={{ minWidth: 350 }}>
                        <Text className='text-2xl text-center pb-2' style={{ color: darkMode ? 'white' : 'black' }}>Sign In QR Code</Text>
                        <QRCode
                            getRef={(c) => { signInQRCodeRef.current = c; }}
                            size={350}
                            value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                            backgroundColor={darkMode ? '#121212' : '#fff'}
                            color={darkMode ? '#fff' : '#000'}
                        />
                        <View className='pt-2'>
                            <Button title="Save QR Code" onPress={saveSignInQRCode} color={darkMode ? "#1E90FF" : undefined} />
                        </View>
                    </View>
                </DismissibleModal>

                <DismissibleModal visible={showSignOutModal} setVisible={setSignOutModal}>
                    <View className={`flex opacity-100 rounded-md px-6 pt-2 pb-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-white'}`} style={{ minWidth: 350 }}>
                        <Text className='text-2xl text-center pb-2' style={{ color: darkMode ? 'white' : 'black' }}>Sign Out QR Code</Text>
                        <QRCode
                            getRef={(c) => { signOutQRCodeRef.current = c; }}
                            size={350}
                            value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                            backgroundColor={darkMode ? '#121212' : '#fff'}
                            color={darkMode ? '#fff' : '#000'}
                        />
                        <View className='pt-2'>
                            <Button title="Save QR Code" onPress={saveSignOutQRCode} color={darkMode ? "#1E90FF" : undefined} />
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
