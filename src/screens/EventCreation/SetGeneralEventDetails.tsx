import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { EventProps, UpdateEventScreenRouteProp } from '../../types/Navigation';
import { useRoute } from '@react-navigation/core';
import { Timestamp } from 'firebase/firestore';
import InteractButton from '../../components/InteractButton';
import { UserContext } from '../../context/UserContext';

const SetGeneralEventDetails = ({ navigation }: EventProps) => {
    const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

    const route = useRoute<UpdateEventScreenRouteProp>();
    const { event } = route.params;
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    // Form Hooks
    const [name, setName] = useState<string>("");
    const [startTime, setStartTime] = useState<Timestamp | undefined>();
    const [endTime, setEndTime] = useState<Timestamp | undefined>();
    const [description, setDescription] = useState();

    if (!event) return (
        <SafeAreaView className='flex flex-col items-center justify-center h-full w-screen'>
            <Text className='mb-10'>An issue occured while trying to load this page</Text>
            <InteractButton
                label='Back to Previous Page'
                onPress={() => navigation.goBack()}
            />
        </SafeAreaView>
    )

    return (
        <SafeAreaView className={darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}>
            {/* Header */}
            <View className='flex-row items-center h-10'>
                <View className='w-screen absolute'>
                    <Text className={`text-2xl font-bold justify-center text-center ${darkMode ? "text-white" : "text-black"}`}>General Event Info</Text>
                </View>
                <TouchableOpacity className='px-6' onPress={() => navigation.goBack()} >
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>
            {/* Form */}
            <ScrollView className={`h-[110%] ${darkMode ? "bg-primary-bg-dark" : ""}`}>
                <View className='px-6'>
                    <InteractButton
                        buttonClassName='bg-orange mt-10 mb-4 py-1 rounded-xl'
                        textClassName='text-center text-black'
                        label='Next Step'
                        underlayColor='#f2aa96'
                        onPress={() => {
                            if (event.copyFromObject) {
                                event.copyFromObject({
                                    name,
                                    startTime,
                                    endTime,
                                    description
                                });
                            }
                        }}
                    />
                    <Text className={`text-xl text-center pt-2 ${darkMode ? "text-white" : "text-black"}`}>Step 2 of 4</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SetGeneralEventDetails;
