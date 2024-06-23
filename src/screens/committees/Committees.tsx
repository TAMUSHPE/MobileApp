import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/core'
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../context/UserContext'
import { auth } from '../../config/firebaseConfig';
import { getCommittees, getUser } from '../../api/firebaseUtils'
import { Committee } from "../../types/committees"
import CommitteeCard from './CommitteeCard'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../../assets';
import { CommitteesStackParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';


const Committees = ({ navigation }: NativeStackScreenProps<CommitteesStackParams>) => {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const { userInfo, setUserInfo } = useContext(UserContext)!;

    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer

    const fetchCommittees = async () => {
        setLoading(true);
        const response = await getCommittees();
        setCommittees(response);
        setLoading(false);
    }


    const fetchUserData = async () => {
        console.log("Fetching user data...");
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            if (firebaseUser) {
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            }
            else {
                console.warn("User data undefined. Data was likely deleted from Firebase.");
            }
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    useEffect(() => {
        fetchCommittees();
        fetchUserData();
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

            <SafeAreaView className='flex-1 bg-white' edges={["top"]}>
                {/* Header */}
                <View className='flex-row px-5 pb-4'>
                    <View className='flex-1 justify-center items-start'>
                        <Image
                            className="h-10 w-52"
                            source={Images.LOGO_LIGHT}
                        />
                    </View>
                </View>
            </SafeAreaView>

            <View>
                {isSuperUser && (
                    <View className='flex items-center w-full'>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("CommitteeEditor", { committee: undefined })}
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

export default Committees;
