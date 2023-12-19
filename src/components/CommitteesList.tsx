import { View, Text, ScrollView, TouchableOpacity, Image, SectionList, SafeAreaView, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect } from 'react'
import CommitteeCard from './CommitteeCard'
import { Committee } from "../types/Committees"
import { CommitteesListProps } from '../types/Navigation'
import { getCommittees } from '../api/firebaseUtils'
import { useFocusEffect } from '@react-navigation/core'

const CommitteesList: React.FC<CommitteesListProps> = ({ navigation }) => {
    const [committees, setCommittees] = React.useState<Committee[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchCommittees = async () => {
        setLoading(true);
        const response = await getCommittees();
        setCommittees(response);
        setLoading(false);
    }
    useFocusEffect(
        useCallback(() => {
            fetchCommittees();
            return () => { };
        }, [])
    );

    const handleCardPress = (committee: Committee): Committee | void => {
        navigation.navigate("CommitteeScreen", { committee });
    };

    return (
        <View className=''>
            <ScrollView>
                {loading && <ActivityIndicator size="large" />}
                {committees.map((committee) => (
                    <CommitteeCard key={committee.name} committee={committee} handleCardPress={() => { handleCardPress(committee) }} />
                ))}
            </ScrollView>
        </View>
    )
}

export default CommitteesList