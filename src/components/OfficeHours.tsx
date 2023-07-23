import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setOfficeHourLog } from '../api/firebaseUtils';

const OfficeHours = () => {
    // const userJSON = await AsyncStorage.getItem("@user");
    // const userData = userJSON ? JSON.parse(userJSON) : undefined;


    return (
        <View className='my-10 py-6 mx-7 justify-center items-center bg-pale-blue rounded-md'>
            <Text className="text-2xl text-white">Office Hours</Text>
            <View className='w-[90%] mt-6 border-white border-2 rounded-sm'>
                <View className='my-4 justify-center items-center text-center'>
                    <Text className='text-white text-lg'>Monday - Thursday</Text>
                    <Text className='text-white text-lg'>10am - 2pm</Text>
                    <View className='border-t-2 border-white w-[80%] my-3'></View>
                    <Text className='text-white text-lg'>Location: Zach 450 - P1</Text>
                    <Text className='text-white text-lg'>Email: tamushpe@gmail.com</Text>
                </View>
            </View>

            {/* 
            Determine if office is aviailable:
            Check lastest event for each officers and if at least one event is "clocked in"
            then button is available to press.

            In Firebase, we will make a event-based table
            If Officer clocks in then log the event
            If Officer clocks out then log the event
             */}


            <TouchableOpacity
                onPress={() => { }}
                className="py-4 px-10 mt-10 border-white border-2 rounded-2xl"
                activeOpacity={0.7}
            >
                <Text className="text-2xl text-white font-extrabold">{true ? "Knock on Wall" : "Unavailable"}</Text>
            </TouchableOpacity>

            <TouchableOpacity>
                <Text className="text-white text-lg mt-4">Office Sign In Button</Text>

            </TouchableOpacity>


        </View>
    )
}

export default OfficeHours;
