import { View, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';
import MembersList from '../components/MembersList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMembersExcludeOfficers, getOfficers } from '../api/firebaseUtils';
import { PublicUserInfoUID } from '../types/User';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    const [officers, setOfficers] = useState<PublicUserInfoUID[]>([])
    const [members, setMembers] = useState<PublicUserInfoUID[]>([])
    const handleCardPress = (uid: string): string | void => {
        navigation.navigate("PublicProfile", { uid });
    };

    useEffect(() => {
        getOfficers().then((officers) => {
            setOfficers(officers)
        })
        getMembersExcludeOfficers().then((members) => {
            setMembers(members)
        })
    }, [])

    return (
        <SafeAreaView>
            <View className='w-full mt-4 justify-center items-center'>
                <Text className='text-3xl h-10'>Users</Text>
            </View>
            <MembersList
                navigation={navigation}
                handleCardPress={handleCardPress}
                officersList={officers}
                membersList={members}
            />
        </SafeAreaView >
    )
}

export default MembersScreen;
