import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackNavigatorParams } from '../types/Navigation';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackNavigatorParams>) => {
    return (
        <View className="flex flex-1 flex-col justify-center items-center">
            <View>Member Screen</View>
        </View>
    )
}

export default MembersScreen;
