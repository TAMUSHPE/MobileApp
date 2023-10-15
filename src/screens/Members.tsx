import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';
import MembersList from '../components/MembersList';
import { SafeAreaView } from 'react-native-safe-area-context';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    const handleCardPress = (uid: string): string | void => {
        navigation.navigate("PublicProfile", { uid });
    };
    return (
        <SafeAreaView>
            <View className='w-full mt-4 justify-center items-center'>
                <Text className='text-3xl h-10'>Users</Text>
            </View>
            <MembersList navigation={navigation} handleCardPress={handleCardPress} />
        </SafeAreaView >
    )
}

export default MembersScreen;
