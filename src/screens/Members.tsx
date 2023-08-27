import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MembersStackParams } from '../types/Navigation';
import { getMembersExcludeOfficers, getOfficers } from '../api/firebaseUtils'

const MembersScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    /**
     * TODO:
     * Get list of officers from firebase in alphabet order
     * Get list of members excluding officers from firebase in alphabet order
     * Display officer -> members where only officers will have year + committee tags while members will only include year
     * Reach Bottom of list then Load more members
     * 
     * Add Filtering System by Officer, year, committee, major, name
     */

    useEffect(() => {
        const fetchList = async () => {
            const officers = await getOfficers();
            const members = await getMembersExcludeOfficers();
            console.log(JSON.stringify(officers, null, 2));
            console.log(JSON.stringify(members, null, 2));
        }
        fetchList();
    })

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
