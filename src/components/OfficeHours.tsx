import { View, Text, Button, TouchableOpacity } from 'react-native'
import React from 'react'

const OfficeHours = () => {
    let available = true;
    return (
        <View className='flex mt-10 justify-center items-center border-4 border-pale-blue rounded-lg py-8 mx-8'>
            <Text className='text-3xl'>Office Hours</Text>
            <Text className='mt-4'> Monday - Thursday </Text>
            <Text> Zach 450-P1 | 10 a.m. - 2 p.m. </Text>
            <TouchableOpacity
                onPress={() => { }}
                className="flex justify-center items-center mt-7 bg-dark-navy rounded-lg"
                activeOpacity={0.7}
            >
                <Text className="p-4 text-xl text-white">{available ? "Knock on Wall" : "Unavailable"}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default OfficeHours