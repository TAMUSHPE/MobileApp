import { View, ScrollView } from 'react-native'
import React, { useCallback, useContext, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/core'
import { getCommittees } from '../../api/firebaseUtils'
import { CommitteesListProps } from '../../types/Navigation'
import { Committee } from "../../types/Committees"
import CommitteeCard from './CommitteeCard'
import { UserContext } from '../../context/UserContext'

const CommitteesList: React.FC<CommitteesListProps> = ({ navigation }) => {
    const [committees, setCommittees] = React.useState<Committee[]>([]);
    const [loading, setLoading] = React.useState(true);

    const { userInfo } = useContext(UserContext)!;
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer

    const fetchCommittees = async () => {
        setLoading(true);
        const response = await getCommittees();
        setCommittees(response);
        setLoading(false);
    }

    useEffect(() => {
        fetchCommittees();
    }, []);

    // a refetch for officer for when they update committees
    useFocusEffect(
        useCallback(() => {
            if (isSuperUser) {
                fetchCommittees();
            }
            return () => { };
        }, [userInfo])
    );

    const handleCardPress = (committee: Committee): Committee | void => {
        navigation.navigate("CommitteeScreen", { committee });
    };

    return (
        <ScrollView>
            {!loading && committees.map((committee) => (
                <CommitteeCard
                    key={committee.name}
                    committee={committee}
                    handleCardPress={() => { handleCardPress(committee) }}
                />
            ))}
        </ScrollView>
    )
}

export default CommitteesList