import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/core'
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext'
import { getCommittees } from '../../api/firebaseUtils'
import { CommitteesListProps } from '../../types/Navigation'
import { Committee } from "../../types/Committees"
import CommitteeCard from './CommitteeCard'

const CommitteesList: React.FC<CommitteesListProps> = ({ navigation }) => {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
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
        }, [isSuperUser])
    );

    return (
        <ScrollView className='pt-4'>
            <View>
                {isSuperUser && (
                    <View className='flex items-center w-full'>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("CommitteeEdit", { committee: undefined })}
                            className='flex-row w-[90%] h-28 rounded-xl bg-[#D3D3D3]'
                        >
                            <View className='flex-1 rounded-l-xl' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                <View className='items-center justify-center h-full'>
                                    <View className='h-16 w-16 items-center justify-center bg-[#D9D9D9] rounded-full'>
                                        <Octicons name="plus" size={40} color="black" />
                                    </View>
                                </View>
                            </View>

                            <View className='w-[70%]  justify-center items-center'>
                                <Text className="font-bold text-xl text-black">Create a Committee</Text>
                            </View>

                        </TouchableOpacity>
                    </View>
                )}

                {loading && (
                    <ActivityIndicator className='mt-8' size="large" />
                )}

                <View className="mt-8" />

                {!loading && committees.map((committee) => (
                    <CommitteeCard
                        key={committee.name}
                        committee={committee}
                        navigation={navigation}
                    />
                ))}
            </View>
        </ScrollView>
    )
}



export default CommitteesList