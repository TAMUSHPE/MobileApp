import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import React, { useContext } from 'react';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { useRoute } from '@react-navigation/core';
import { Images } from '../../../assets';
import InteractButton from '../../components/InteractButton';
import { formatDate, formatDateTime } from '../../helpers/timeUtils';
import { createEvent } from '../../api/firebaseUtils';


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
                <View className='flex flex-col p-4'>
                    <Image
                        source={event.coverImageURI ? { uri: event.coverImageURI } : Images.EVENT}
                        resizeMode='contain'
                        style={{
                            width: "100%",
                            height: undefined,
                            aspectRatio: 16 / 9,
                        }}
                    />
                    <View className='py-2'>
                        <Text className={`text-xl ${darkMode ? "text-[#229fff]" : "text-[#5233ff]"}`}><Octicons name='calendar' size={24} /> {formatDateTime(event.startTime!.toDate())}</Text>
                        <Text className={`text-4xl ${darkMode ? "text-white" : "text-black"}`}>{event.name}</Text>
                        <Text className={`text-2xl ${darkMode ? "text-[#DDD]" : "text-[#333]"}`}>{event.description}</Text>
                    </View>
                </View>
                <InteractButton
                    label='Create Event'
                    onPress={async () => {
                        await createEvent(event);
                        navigation.navigate("EventsScreen");
                    }}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default FinalizeEvent;
