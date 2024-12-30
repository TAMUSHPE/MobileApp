import React, { useContext, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, useColorScheme, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../../types/navigation';
import { createInstagramPointsEvent, fetchEventByName, getUsers } from '../../api/firebaseUtils';
import { PublicUserInfo } from '../../types/user';
import MemberCardMultipleSelect from '../../components/MemberCardMultipleSelect';
import { SHPEEvent } from '../../types/events';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserContext } from '../../context/UserContext';
import debounce from 'lodash/debounce';
/**
 * InstagramPoints screen for admin to add points to members who participated in the Instagram Points event.
 * This relies on the fact that an admin but create an event called "Instagram Points" along with 1 point for signing in.
 * The date should be set to the end of the school year. 
 */

const InstagramPoints = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [members, setMembers] = useState<SelectedPublicUserInfo[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<PublicUserInfo[]>([]);
    const [instagramEvent, setInstagramEvent] = useState<SHPEEvent | null>(null);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    const insets = useSafeAreaInsets();

    const cacheKey = 'selectedInstagramMembers';

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const cachedMembers = await AsyncStorage.getItem(cacheKey);
                let fetchedMembers: PublicUserInfo[] = await getUsers();
                if (cachedMembers) {
                    const parsedMembers = JSON.parse(cachedMembers);
                    fetchedMembers = fetchedMembers.map(member => ({
                        ...member,
                        selected: !!parsedMembers.find((cached: SelectedPublicUserInfo) => cached.uid === member.uid && cached.selected),
                    }));
                } else {
                    fetchedMembers = fetchedMembers.map(member => ({
                        ...member,
                        selected: false,
                    }));
                }
                setMembers(fetchedMembers);
            } catch (error) {
                console.error('Error fetching members:', error);
            } finally {
                setLoading(false);
            }
        };

        const initializeData = async () => {
            try {
                const event = await fetchEventByName("Instagram Points");

                if (event) {
                    setInstagramEvent(event);
                } else {
                    const createdEvent = await createInstagramPointsEvent();
                    if (createdEvent) {
                        console.log("Instagram Points event created:", createdEvent);
                        setInstagramEvent(createdEvent);
                    } else {
                        console.error("Failed to create Instagram Points event");
                    }
                }
            } catch (error) {
                console.error("Error initializing Instagram Points event:", error);
            }
        };

        initializeData();
        fetchMembers();
    }, []);

    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            if (query.length >= 2) {
                const filtered = members.filter(member =>
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

    const handleCardSelect = async (uid: string) => {
        const updatedMembers = members.map(member =>
            member.uid === uid ? { ...member, selected: !member.selected } : member
        );
        setMembers(updatedMembers);

        // Cache selected members
        const selectedMembers = updatedMembers.filter(member => member.selected);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(selectedMembers));
    };

    const handleSubmit = async () => {
        if (!instagramEvent) {
            alert('Create a hidden Event called "Instagram Points"');
            return;
        }

        const selectedMembers = members.filter(member => member.selected);
        if (selectedMembers.length === 0) {
            alert('Please select at least one member.');
            return;
        }

        setLoading(true);

        try {
            const functions = getFunctions();
            const addInstagramPoints = httpsCallable(functions, 'addInstagramPoints');

            setMembers(prevMembers => prevMembers.map(member => ({
                ...member,
                selected: false
            })));

            setSearch('');

            const promises = selectedMembers.map(member => {
                return addInstagramPoints({
                    uid: member.uid,
                    eventID: instagramEvent?.id
                });
            });

            await Promise.all(promises);

            const memberNames = selectedMembers.map(member => member.name).join(', ');
            alert(`We added ${instagramEvent?.signInPoints} points to the following members: ${memberNames}`);
        } catch (error) {
            console.error('Error updating points:', error);
        } finally {
            setLoading(false);
        }

        await AsyncStorage.removeItem(cacheKey);
    };

    return (
        <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`} style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center mx-5 mt-1">
                <View className="absolute w-full justify-center items-center">
                    <Text className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Instagram Points</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Octicons name="chevron-left" size={30} color={darkMode ? "white" : "black"} />
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="small" className='mt-4' />}

            {/* Search Bar */}
            {!loading && (
                <View className='px-4 mt-6'>
                    <View className='flex-row mb-4'>
                        <View
                            className={`rounded-xl px-4 py-2 flex-row flex-1 items-center ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                            style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                        >
                            <View className='mr-3'>
                                <Octicons name="search" size={24} color={darkMode ? "white" : "black"} />
                            </View>
                            <TextInput
                                style={{ textAlignVertical: 'top', color: darkMode ? 'white' : 'black' }}
                                onChangeText={(text) => { setSearch(text); }}
                                value={search}
                                underlineColorAndroid="transparent"
                                placeholder="Search"
                                placeholderTextColor={"grey"}
                                className='flex-1 text-lg justify-center'
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Octicons name="x" size={24} color={darkMode ? "white" : "black"} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            )}


            <View>
                {/* Members List */}
                {!loading && (
                    <FlatList
                        data={search.length >= 2 ? filteredMembers : members.filter(member => member.selected)}
                        keyExtractor={(item) => item.uid!}
                        renderItem={({ item }) => (
                            <MemberCardMultipleSelect
                                userData={item}
                                handleCardPress={(uid) => handleCardSelect(uid!)}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 120 }}
                        ListEmptyComponent={
                            <View className='w-full'>
                                {search.length < 2 && members.filter(member => member.selected).length === 0 ? (
                                    <Text className={`text-center text-lg ${darkMode ? "text-white" : "text-black"}`}>
                                        Begin Search
                                    </Text>
                                ) : (
                                    <Text className={`text-center text-lg ${darkMode ? "text-white" : "text-black"}`}>
                                        {search.length >= 2 ? "No matching members found." : "No members selected."}
                                    </Text>
                                )}
                            </View>
                        }
                    />
                )}
            </View>

            <View className='absolute bottom-5 right-5'>
                <TouchableOpacity
                    className='py-4 px-8 bg-primary-blue rounded-lg shadow-lg justify-center items-center'
                    onPress={handleSubmit}
                >
                    <Text className='text-white text-xl font-bold'>
                        Done
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

interface SelectedPublicUserInfo extends PublicUserInfo {
    selected?: boolean;
}

export default InstagramPoints;
