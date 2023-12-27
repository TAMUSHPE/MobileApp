import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import React, { useContext } from 'react';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { useRoute } from '@react-navigation/core';
import { Images } from '../../../assets';


const FinalizeEvent = ({ navigation }: EventProps) => {
    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    return (
        <SafeAreaView className={`flex flex-col h-screen ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>Review Your Work</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>
            <ScrollView className={`flex flex-col flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-white"}`}>
                <Image
                    source={event.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                    resizeMode='contain'
                    style={{
                        width: "100%",
                        height: undefined,
                        aspectRatio: 16 / 9,
                    }}
                />
                <View className='py-2 px-4'>
                    <Text className={`text-4xl text-center ${darkMode ? "text-white" : "text-black"}`}>{event.name}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default FinalizeEvent;
