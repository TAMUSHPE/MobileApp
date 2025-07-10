import React, { useState, useRef, useContext } from 'react';
import { View, Text, Alert, ActivityIndicator, Button, useColorScheme, Image } from 'react-native';
import { RouteProp } from '@react-navigation/core';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import DismissibleModal from '../../components/DismissibleModal';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventsStackParams } from '../../types/navigation';
import { UserContext } from '../../context/UserContext';
import { Images } from '../../../assets';

const QRCodeManager: React.FC<QRCodeScreenRouteProp> = ({ route, navigation }) => {
    const { event } = route.params;

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const signInQRCodeRef = useRef<ViewShot>(null!);
    const signOutQRCodeRef = useRef<ViewShot>(null!);

    const [loading, setLoading] = useState<boolean>(false);
    const [showSignInModal, setSignInModal] = useState<boolean>(false);
    const [showSignOutModal, setSignOutModal] = useState<boolean>(false);

    const saveQRCode = async (viewShotRef: React.RefObject<ViewShot>, type: string) => {
        if (viewShotRef.current) {
            try {
                setLoading(true);

                const uri = await viewShotRef.current.capture?.();
                if (!uri) throw new Error('Capture failed');

                const currentDate = new Date().toISOString().replace(/[-:.]/g, '');
                const sanitizedEventName = event.name?.replace(/[\/\\:*?"<>|#]/g, '_');

                const fileUri = `${FileSystem.documentDirectory}${currentDate}_${sanitizedEventName}_${type}.png`;

                await FileSystem.copyAsync({ from: uri, to: fileUri });

                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                if (fileInfo.exists && (await Sharing.isAvailableAsync())) {
                    await Sharing.shareAsync(fileUri);
                }

                setLoading(false);
            } catch (error) {
                console.error('Save QRCode error:', error);
                Alert.alert('Error', 'Something went wrong while saving the QR Code.');
                setLoading(false);
            }
        }
    };

    const saveSignInQRCode = () => saveQRCode(signInQRCodeRef, 'sign-in');
    const saveSignOutQRCode = () => saveQRCode(signOutQRCodeRef, 'sign-out');

    const signInLogo = event.signOutPoints == null ? Images.QR_CODE_LOGO : Images.SIGN_IN_LOGO;
    const signOutLogo = event.signInPoints == null ? Images.QR_CODE_LOGO : Images.SIGN_OUT_LOGO;

    return (
        <GestureHandlerRootView>
            <SafeAreaView className={`flex-1 ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`}>
                <View className="flex-row items-center h-10">
                    <View className="pl-6">
                        <TouchableOpacity className="pr-4" onPress={() => navigation.goBack()}>
                            <Octicons name="chevron-left" size={30} color={darkMode ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row items-center">
                    <View className="w-screen p-4">
                        <Text className="text-2xl font-bold text-center" style={{ color: darkMode ? 'white' : 'black' }}>
                            {event.name}
                        </Text>
                    </View>
                </View>

                <View className="w-screen">
                    <View className="justify-center items-center">
                        {!event.signInPoints && !event.signOutPoints && event.signInPoints !== 0 && event.signOutPoints !== 0 && (
                            <View>
                                <Text className="text-center text-2xl font-bold" style={{ color: darkMode ? 'white' : 'black' }}>
                                    No QR Codes Available
                                </Text>
                            </View>
                        )}

                        {event.signInPoints != null && (
                            <View className="my-4 rounded-md border-1 p-2 w-[85%] h-20 px-5" style={{ backgroundColor: darkMode ? '#222' : '#EEE' }}>
                                <TouchableOpacity className="flex-row items-center" onPress={() => setSignInModal(true)}>
                                    <View className="my-4 flex-row items-center flex-1">
                                        <Text className="text-2xl text-center font-bold" style={{ color: darkMode ? 'white' : 'black' }}>
                                            Sign In QR Code
                                        </Text>
                                    </View>
                                    <View>
                                        <ViewShot ref={signInQRCodeRef} options={{ format: 'png', quality: 1.0 }}>
                                            <View style={{ width: 60, height: 60 }}>
                                                <QRCode
                                                    size={60}
                                                    value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                                                    backgroundColor={darkMode ? '#121212' : '#fff'}
                                                    color={darkMode ? '#fff' : '#000'}
                                                />
                                                <Image
                                                    source={signInLogo}
                                                    style={{ position: 'absolute', width: 20, height: 20, top: 20, left: 20 }}
                                                />
                                            </View>
                                        </ViewShot>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {event.signOutPoints != null && (
                            <View className="my-4 rounded-md border-1 p-2 w-[85%] h-20 px-5" style={{ backgroundColor: darkMode ? '#222' : '#EEE' }}>
                                <TouchableOpacity className="flex-row items-center" onPress={() => setSignOutModal(true)}>
                                    <View className="my-4 flex-row items-center flex-1">
                                        <Text className="text-2xl text-center font-bold" style={{ color: darkMode ? 'white' : 'black' }}>
                                            Sign Out QR Code
                                        </Text>
                                    </View>
                                    <View>
                                        <ViewShot ref={signOutQRCodeRef} options={{ format: 'png', quality: 1.0 }}>
                                            <View style={{ width: 60, height: 60 }}>
                                                <QRCode
                                                    size={60}
                                                    value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                                                    backgroundColor={darkMode ? '#121212' : '#fff'}
                                                    color={darkMode ? '#fff' : '#000'}
                                                />
                                                <Image
                                                    source={signOutLogo}
                                                    style={{ position: 'absolute', width: 20, height: 20, top: 20, left: 20 }}
                                                />
                                            </View>
                                        </ViewShot>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {loading && <ActivityIndicator size="small" color={darkMode ? '#fff' : '#0000ff'} />}
                    </View>
                </View>

                <DismissibleModal visible={showSignInModal} setVisible={setSignInModal}>
                    <View className={`flex opacity-100 rounded-md px-6 pt-2 pb-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-white'}`} style={{ minWidth: 350 }}>
                        <Text className="text-2xl text-center pb-2" style={{ color: darkMode ? 'white' : 'black' }}>
                            Sign In QR Code
                        </Text>
                        <ViewShot ref={signInQRCodeRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={{ width: 350, height: 350 }}>
                                <QRCode
                                    size={350}
                                    value={`tamu-shpe://event?id=${event.id}&mode=sign-in`}
                                    backgroundColor={darkMode ? '#121212' : '#fff'}
                                    color={darkMode ? '#fff' : '#000'}
                                />
                                <Image source={signInLogo} style={{ position: 'absolute', width: 70, height: 70, top: 140, left: 140 }} />
                            </View>
                        </ViewShot>
                        <View className="pt-2">
                            <Button title="Save QR Code" onPress={saveSignInQRCode} color={darkMode ? '#1E90FF' : undefined} />
                        </View>
                    </View>
                </DismissibleModal>

                <DismissibleModal visible={showSignOutModal} setVisible={setSignOutModal}>
                    <View className={`flex opacity-100 rounded-md px-6 pt-2 pb-6 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-white'}`} style={{ minWidth: 350 }}>
                        <Text className="text-2xl text-center pb-2" style={{ color: darkMode ? 'white' : 'black' }}>
                            Sign Out QR Code
                        </Text>
                        <ViewShot ref={signOutQRCodeRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={{ width: 350, height: 350 }}>
                                <QRCode
                                    size={350}
                                    value={`tamu-shpe://event?id=${event.id}&mode=sign-out`}
                                    backgroundColor={darkMode ? '#121212' : '#fff'}
                                    color={darkMode ? '#fff' : '#000'}
                                />
                                <Image source={signOutLogo} style={{ position: 'absolute', width: 70, height: 70, top: 140, left: 140 }} />
                            </View>
                        </ViewShot>
                        <View className="pt-2">
                            <Button title="Save QR Code" onPress={saveSignOutQRCode} color={darkMode ? '#1E90FF' : undefined} />
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

export default QRCodeManager;
