import { View, Text, ScrollView, TouchableOpacity, Image, SectionList, SafeAreaView, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import CommitteeCard from './CommitteeCard'
import { Committee } from "../types/Committees"
import { CommitteesTabProps } from '../types/Navigation'
import { getCommittees } from '../api/firebaseUtils'

const CommitteesTab: React.FC<CommitteesTabProps> = ({ navigation }) => {
    const [committees, setCommittees] = React.useState<Committee[]>([]);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const fetchCommittees = async () => {
            const response = await getCommittees();
            setCommittees(response);
            setLoading(false);
        }

        fetchCommittees();
    }, [])

    const handleCardPress = (committee: Committee): Committee | void => {
        navigation.navigate("CommitteeInfoScreen", { committee });
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

export default CommitteesTab