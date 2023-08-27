import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';
import MembersList from '../components/MembersList';
import { SafeAreaView } from 'react-native-safe-area-context';

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    /**
     * TODO:
     * Get list of officers from firebase in alphabet order
     * Get list of members excluding officers from firebase in alphabet order
     * Display officer -> members where only officers will have year + committee tags while members will only include year
     * 
     * Add Filtering System by Officer, year, committee, major, name
     * 
     */

    return (
        <SafeAreaView>
            <Text>Members Screen</Text>
            <MembersList navigation={navigation} />
        </SafeAreaView >
    )
}

export default MembersScreen;
