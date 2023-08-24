import { View, Text } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    return (
        <View className="flex flex-1 flex-col justify-center items-center">
            <View>
                <Text>
                    Member Screen
                </Text>
            </View>
        </View>
    )
}

export default MembersScreen;
