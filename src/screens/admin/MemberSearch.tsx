import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../../types/navigation';
import { getUsers } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import MemberCard from '../../components/MemberCard';
import { PublicUserInfo } from '../../types/user';

const MemberSearch = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const insets = useSafeAreaInsets();

    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<PublicUserInfo[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const fetchedMembers = await getUsers();
                setMembers(fetchedMembers);
            } catch (error) {
                console.error('Error fetching members:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const debouncedSearch = useMemo(
        () =>
            debounce((query: string) => {
                if (query.length >= 2) {
                    const filtered = members.filter(
                        (member) =>
                            member.name?.toLowerCase().includes(query.toLowerCase()) ||
                            member.displayName?.toLowerCase().includes(query.toLowerCase())
                    );
                    setFilteredMembers(filtered);
                } else {
                    setFilteredMembers([]);
                }
            }, 300),
        [members]
    );

    useEffect(() => {
        debouncedSearch(search);
    }, [search, debouncedSearch]);

    return (
        <SafeAreaView edges={["top"]} className={`flex-1 ${darkMode ? 'bg-primary-bg-dark' : 'bg-primary-bg-light'}`} >
            {/* Header */}
            <View className='flex-row items-center mx-5 mt-1'>
                <View className='absolute w-full justify-center items-center'>
                    <Text className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Member Search</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Octicons name="chevron-left" size={30} color={darkMode ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1">
                {loading && <ActivityIndicator size="small" className="mt-4" />}

                {!loading && (
                    <>
                        {/* Search Bar */}
                        <View className='px-4 mt-6'>
                            <View className='flex-row mb-4'>
                                <View
                                    className={`rounded-xl px-4 py-2 flex-row flex-1 items-center ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 3.84,
                                        elevation: 5,
                                    }}
                                >
                                    <View className='mr-3'>
                                        <Octicons name="search" size={24} color={darkMode ? 'white' : 'black'} />
                                    </View>
                                    <TextInput
                                        style={{ color: darkMode ? 'white' : 'black' }}
                                        onChangeText={setSearch}
                                        value={search}
                                        placeholder="Search"
                                        placeholderTextColor="grey"
                                        className='flex-1 text-lg'
                                    />
                                    {search.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearch('')}>
                                            <Octicons name="x" size={24} color={darkMode ? 'white' : 'black'} style={{ marginLeft: 8 }} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Members List */}
                        <FlatList
                            data={search.length >= 2 ? filteredMembers : []}
                            keyExtractor={(item) => item.uid!}
                            renderItem={({ item }) => (
                                <MemberCard
                                    userData={item}
                                    handleCardPress={(uid) => navigation.navigate('PublicProfile', { uid: uid! })}
                                />
                            )}
                            ListEmptyComponent={
                                <View className='w-full mt-4'>
                                    <Text className={`text-center text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
                                        {search.length < 2 ? 'Begin typing to search...' : 'No matching members found.'}
                                    </Text>
                                </View>
                            }
                            contentContainerStyle={{
                                marginLeft: 16,
                                marginRight: 16,
                                paddingBottom: insets.bottom + 32,
                            }}
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

export default MemberSearch;
