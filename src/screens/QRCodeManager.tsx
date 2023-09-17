import { View, Text } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { QRCodeProps, QRCodeScreenRouteProp } from '../types/Navigation'
import { useRoute } from '@react-navigation/core';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Octicons } from '@expo/vector-icons';


const QRCodeManager = ({ navigation }: QRCodeProps) => {
    const route = useRoute<QRCodeScreenRouteProp>();
    const { event } = route.params;

    return (
        <GestureHandlerRootView>
            <SafeAreaView>
                <View className='flex-row items-center h-10'>
                    <View className='w-screen absolute'>
                        <Text className="text-2xl font-bold justify-center text-center">{event.name} QRCode</Text>
                    </View>
                    <View className='pl-6'>
                        <TouchableOpacity className="pr-4" onPress={() => {
                            console.log("test");
                            navigation.goBack();
                        }}>
                            <Octicons name="chevron-left" size={30} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='w-screen'>
                    <View className='justify-center items-center'>
                        <QRCode size={300} value={`tamu-shpe://event?id=${event.id}`} />
                        <Text className='mt-4 px-8'>Download/Share to be implemented. For now test by taking screenshot or use two devices.</Text>
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}

export default QRCodeManager