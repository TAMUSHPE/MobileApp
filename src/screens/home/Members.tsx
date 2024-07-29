import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, useColorScheme } from 'react-native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import MemberCard from '../../components/MemberCard';
import { PublicUserInfo } from '../../types/user';
import { Octicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserForMemberList } from '../../api/firebaseUtils';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../../types/navigation';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';

enum FilterRole {
    OFFICER = "Officer",
    REPRESENTATIVE = "Representative",
    LEAD = "Lead",
}

const Members = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [endOfData, setEndOfData] = useState<boolean>(false);
    const lastUserSnapshotRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<FilterRole | null>(null);

    const loadMoreUsers = async () => {
        setLoading(true);

        const { members: newMembers, lastVisibleDoc } = await getUserForMemberList(9, lastUserSnapshotRef.current, selectedFilter, setEndOfData);
        setMembers(prevMembers => [...prevMembers, ...newMembers.map(doc => ({ ...doc, uid: doc.id }))]);
        lastUserSnapshotRef.current = lastVisibleDoc;

        setLoading(false);
    };

    const fetchInitialUsers = async () => {
        setMembers([]);
        setLoading(true);

        const { members: newMembers, lastVisibleDoc } = await getUserForMemberList(9, null, selectedFilter, setEndOfData);
        setMembers(newMembers.map(doc => ({ ...doc, uid: doc.id })));
        lastUserSnapshotRef.current = lastVisibleDoc;

        setLoading(false);
    };

    useEffect(() => {
        fetchInitialUsers();
    }, [selectedFilter]);

    const handleFilterSelect = (filter: FilterRole | null) => {
        setEndOfData(false);
        lastUserSnapshotRef.current = null;

        setSelectedFilter(prevFilter => (prevFilter === filter ? null : filter));
    };

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        };

        if (isCloseToBottom(nativeEvent) && !loading && !endOfData) {
            loadMoreUsers();
        }
    }, [loading, endOfData]);

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={200}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className='flex-row items-center justify-between mb-3'>
                    <View className='absolute w-full justify-center items-center'>
                        <Text className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Members</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className='py-1 px-4'>
                        <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                <ScrollView
                    className='py-3 mb-6'
                    showsHorizontalScrollIndicator={false}
                    horizontal={true}
                >
                    <View className='flex-row px-4 space-x-3'>
                        {Object.values(FilterRole).map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-row items-center justify-center rounded-md py-2 px-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${selectedFilter === type && 'bg-primary-blue border-primary-blue'}`}
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}
                                onPress={() => handleFilterSelect(type as FilterRole)}
                            >
                                <Text className={`font-bold ${selectedFilter === type ? 'text-white' : `${darkMode ? "text-white" : "text-black"}`}`}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Members List */}
                <View className='px-4'>
                    {members?.map((userData, index) => {
                        if (!userData.name) {
                            return null; // Hacky fix for users who have not completed registration
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

                    {loading && (
                        <View className='justify-center'>
                            <ActivityIndicator size="small" />
                        </View>
                    )}

                    {endOfData && !loading && (
                        <View className='flex-1'>
                            <Text className='text-xl text-center'>No more members</Text>
                        </View>
                    )}
                </View>

                <View className='pb-10' />
            </ScrollView>
        </SafeAreaView>
    );
};

export default Members;
