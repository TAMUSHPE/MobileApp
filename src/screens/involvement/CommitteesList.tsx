import { View, ScrollView } from 'react-native'
import React, { useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/core'
import { getCommittees } from '../../api/firebaseUtils'
import { CommitteesListProps } from '../../types/Navigation'
import { Committee } from "../../types/Committees"
import CommitteeCard from './CommitteeCard'

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
                {!loading && committees.map((committee) => (
                    <CommitteeCard
                        key={committee.name}
                        committee={committee}
                        handleCardPress={() => { handleCardPress(committee) }}
                    />
                ))}
            </ScrollView>
        </View>
    )
}

export default CommitteesList