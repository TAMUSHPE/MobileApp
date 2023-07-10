import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackNavigatorParamList } from '../types/Navigation';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackNavigatorParamList>) => {
    return (
        <View className="flex flex-1 flex-col justify-center items-center">
            <TouchableOpacity
                className='flex justify-center items-center mt-4 p-6 rounded-md bg-[#500]'
                onPress={() => {
                    navigation.navigate("PublicProfile", {email: ""}); // Email currently stubbed out
                }}>
                <Text className='font-bold text-white text-5xl'>go to a member public profole</Text>
            </TouchableOpacity>
        </View>
    )
}

export default MembersScreen;
