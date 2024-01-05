import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, NativeScrollEvent } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { MembersStackParams } from '../types/Navigation'
import MemberCard from '../components/MemberCard'
import { PublicUserInfo, UserFilter } from '../types/User';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOfficers, getUserForMemberList } from '../api/firebaseUtils';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const Members = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filter, setFilter] = useState<UserFilter>({ major: "", classYear: "", role: "" });
    const [officers, setOfficers] = useState<PublicUserInfo[]>([]);
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUserSnapshot, setLastUserSnapshot] = useState<QueryDocumentSnapshot<DocumentData>>();
    const [hasMoreUser, setHasMoreUser] = useState(true);

    const loadUsers = async (appliedFilter: UserFilter, lastSnapshot?: QueryDocumentSnapshot<DocumentData> | null, numLimit: number | null = 15) => {
        setLoading(true);

        const response = await getUserForMemberList({
            lastUserSnapshot: lastSnapshot,
            numLimit: numLimit,
            filter: appliedFilter,
        });


        setHasMoreUser(response.hasMoreUser);

        if (response.members.length > 0) {
            setLastUserSnapshot(response.lastSnapshot!);
            setMembers(prevMembers => [...prevMembers, ...response.members.map(doc => ({ ...doc.data(), uid: doc.id }))]);
        }

        setLoading(false);
    };

    const handleApplyFilter = async () => {
        if (filter.classYear === "" && filter.major === "" && filter.role === "") {
            return;
        }
        setMembers([]);
        setHasMoreUser(false);
        await loadUsers(filter, null, null);
    };

    const handleRestFilter = async () => {
        setMembers([]);
        setHasMoreUser(true);
        setFilter({ major: "", classYear: "", role: "" });
        await loadUsers({ major: "", classYear: "", role: "" });
    };

    useEffect(() => {
        const fetchOfficers = async () => {
            const officers = await getOfficers() as PublicUserInfo[];
            setOfficers(officers);
        }

        loadUsers(filter); // Initial load
        fetchOfficers();
    }, []);

    const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };
    return (
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View className='px-4 mt-4'>
                <Text className='font-bold text-xl'>Members</Text>
                <View className='flex-row mb-4 justify-end'>
                    <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='px-4 items-center justify-center'
                        style={{ minWidth: 45 }}
                    >
                        {showFilterMenu ? (
                            <Octicons name="x" size={27} color="black" />
                        ) : (
                            <Octicons name="filter" size={27} color="black" />
                        )}
                    </TouchableOpacity>
                </View>

                {showFilterMenu && (
                    <View className='flex-row mt-2 mb-8'>
                        <View className='flex-1 space-y-4'>
                            <View className='justify-start flex-row'>
                                <TextInput
                                    value={filter?.classYear}
                                    onChangeText={(text) => setFilter({ ...filter, classYear: text })}
                                    placeholder="Class Year"
                                    className='bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />
                                <TextInput
                                    value={filter?.major}
                                    onChangeText={(text) => setFilter({ ...filter, major: text })}
                                    placeholder="Major"
                                    className='bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />
                                <TouchableOpacity
                                    onPress={() => handleApplyFilter()}
                                    className='items-center justify-center bg-pale-blue py-2 w-20 rounded-lg ml-3'>
                                    <Text className='text-white font-bold text-xl'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-start flex-row'>
                                <TextInput
                                    value={filter?.role}
                                    onChangeText={(text) => setFilter({ ...filter, role: text })}
                                    placeholder="Role"
                                    className='bg-white border-gray-400 font-semibold border rounded-md text-xl w-28 py-1 pl-2 mr-4'
                                />
                                <View className='w-28 mr-4'></View>
                                <TouchableOpacity
                                    onPress={() => handleRestFilter()}
                                    className='items-center justify-center py-2 w-20 rounded-lg ml-3'>
                                    <Text className='font-bold text-xl text-pale-blue'>Rest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView
                onScroll={({ nativeEvent }) => {
                    if (isCloseToBottom(nativeEvent) && !loading && hasMoreUser) {
                        if (lastUserSnapshot) {
                            loadUsers(filter, lastUserSnapshot);
                        } else {
                            loadUsers(filter, undefined);
                        }
                    }
                }}
                scrollEventThrottle={400}
            >
                <View className='px-4'>
                    {officers?.map((userData, index) => {
                        if (!userData.name) {
                            return null; // this is a hacky fix for user that have not completed registration
                        }
                        return (
                            <MemberCard
                                key={index}
                                userData={userData}
                                navigation={navigation}
                                handleCardPress={() => { navigation.navigate("PublicProfile", { uid: userData.uid! }) }}
                            />
                        );
                    })}
                    {members?.map((userData, index) => {
                        if (!userData.name) {
                            return null; // this is a hacky fix for user that have not completed registration
                        }
                        return (
                            <MemberCard
                                key={index}
                                userData={userData}
                                navigation={navigation}
                                handleCardPress={() => { navigation.navigate("PublicProfile", { uid: userData.uid! }) }}
                            />
                        );
                    })}

                    {(loading && hasMoreUser) && (
                        <View className='flex justify-center my-4'>
                            <ActivityIndicator size="large" />
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Members