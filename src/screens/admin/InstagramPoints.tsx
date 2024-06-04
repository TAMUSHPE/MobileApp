import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../../types/navigation';
import { fetchEventByName, getMembers } from '../../api/firebaseUtils';
import { PublicUserInfo } from '../../types/user';
import MemberCardMultipleSelect from '../../components/MemberCardMultipleSelect';
import { SHPEEvent } from '../../types/events';
import { getFunctions, httpsCallable } from 'firebase/functions';


/**
 * InstagramPoints screen for admin to add points to members who participated in the Instagram Points event.
 * This relies on the fact that an admin but create an event called "Instagram Points" along with 1 point for signing in.
 * The date should be set to the end of the school year. 
 */

const InstagramPoints = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const [members, setMembers] = useState<SelectedPublicUserInfo[]>([])
    const [event, setEvent] = useState<SHPEEvent | null>(null)
    const [search, setSearch] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(true)

    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const fetchedMembers: PublicUserInfo[] = await getMembers();
                const extendedMembers = fetchedMembers.map(member => ({
                    ...member,
                    selected: false,
                }));
                setMembers(extendedMembers);
            } catch (error) {
                console.error('Error fetching members:', error);
            } finally {
                setLoading(false);
            }
        };

        const initializeData = async () => {
            const event = await fetchEventByName('Instagram Points');
            setEvent(event);
            await fetchMembers();
        };


        fetchMembers();
        initializeData();
    }, []);


    const filteredMembers = members.filter(member =>
        member.name?.toLowerCase().includes(search.toLowerCase()) ||
        member.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    const handleCardSelect = (uid: string) => {
        setMembers(prevMembers =>
            prevMembers.map(member =>
                member.uid === uid ? { ...member, selected: !member.selected } : member
            )
        );
    };

    const handleSubmit = async () => {
        if (!event) {
            alert('Talk to an admin to create a fake event called "Instagram Points"');
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

            // Reset selected members to unselected
            setMembers(prevMembers => prevMembers.map(member => ({
                ...member,
                selected: false
            })));

            setSearch('');

            const promises = selectedMembers.map(member => {
                return addInstagramPoints({
                    uid: member.uid,
                    eventID: event.id
                });
            });

            await Promise.all(promises);

            const memberNames = selectedMembers.map(member => member.name).join(', ');
            alert(`We added ${event.signInPoints} points to the following members: ${memberNames}`);
        } catch (error) {
            console.error('Error updating points:', error);
        } finally {
            setLoading(false);
        }
    }

    const selectedCount = members.filter(member => member.selected).length;

    return (
        <View className="h-full" style={{ paddingTop: insets.top }}>
            <ScrollView>
                {/* Header */}
                <View className="flex-row items-center mx-5 mt-1">
                    <View className="absolute w-full justify-center items-center">
                        <Text className="text-2xl font-semibold">Instagram Points</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className='px-4 mt-6'>
                    <View className='flex-row mb-4'>
                        <TouchableOpacity
                            activeOpacity={1}
                            className='bg-gray-300 rounded-xl px-4 py-2 flex-row flex-1'
                        >
                            <View className='mr-3'>
                                <Octicons name="search" size={24} color="grey" />
                            </View>
                            <TextInput
                                style={{ textAlignVertical: 'top' }}
                                onChangeText={(text) => { setSearch(text); }}
                                value={search}
                                underlineColorAndroid="transparent"
                                placeholder="Search"
                                className='flex-1 text-lg justify-center'
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className='px-4'>
                    {loading && <ActivityIndicator size="large" />}
                    {/* Members List */}
                    {!loading && filteredMembers?.map((userData, index) => {
                        if (!userData.name) {
                            return null;
                        }
                        return (
                            <MemberCardMultipleSelect
                                key={index}
                                userData={userData}
                                handleCardPress={(uid) => handleCardSelect(uid!)}
                            />
                        );
                    })}

                </View>

                <View className='pb-24' />
            </ScrollView>

            <View className='absolute bottom-5 w-full'>
                <TouchableOpacity
                    className='absolute bottom-5 py-4 w-[90%] self-center bg-pale-blue rounded-lg shadow-lg justify-center items-center'
                    onPress={handleSubmit}
                >
                    <Text className='text-white text-xl font-bold'>
                        Adding {(event?.signInPoints)} Point to ({selectedCount} selected members)
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

interface SelectedPublicUserInfo extends PublicUserInfo {
    selected?: boolean;
}

export default InstagramPoints