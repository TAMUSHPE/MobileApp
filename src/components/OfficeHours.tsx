import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const OfficeHours = () => {
    let available = true;
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

            <TouchableOpacity
                onPress={() => { }}
                className="py-4 px-10 mt-10 border-white border-2 rounded-2xl"
                activeOpacity={0.7}
            >
                <Text className="text-2xl text-white font-extrabold">{available ? "Knock on Wall" : "Unavailable"}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default OfficeHours;
