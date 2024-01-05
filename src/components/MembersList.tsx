import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { MemberListProps } from '../types/Navigation'
import MemberCard from './MemberCard'
import { PublicUserInfo } from '../types/User';

const MembersList: React.FC<MemberListProps> = ({ handleCardPress, users, navigation }) => {
    const [search, setSearch] = useState<string>("")
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filter, setFilter] = useState<{ major: string, classYear: string, role: string }>({ major: "", classYear: "", role: "" });
    const [members, setMembers] = useState<PublicUserInfo[]>(users)
    const inputRef = useRef<TextInput>(null);


    const updateFilteredMembers = () => {
        let filtered = users.filter(user => {
            const matchesSearch = search === "" ||
                user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(search.toLowerCase());
            const matchesMajor = filter.major === "" || user.major?.includes(filter.major);
            const matchesClassYear = filter.classYear === "" || user.classYear === filter.classYear;
            const matchesRole = filter.role === "" || (user.roles as any)?.[filter.role] === true;


            return matchesSearch && matchesMajor && matchesClassYear && matchesRole;
        });
        setMembers(filtered);
    };

    useEffect(() => {
        updateFilteredMembers();
    }, [search, filter, users]);

    const handleApplyFilter = async () => {
        updateFilteredMembers();
    };

    const handleClearFilter = async () => {
        setFilter({ major: "", classYear: "", role: "" });
    };


    return (
        <View className='flex-1'>
            <View className='px-4'>
                <View className='flex-row mb-4'>
                    <TouchableOpacity
                        activeOpacity={1}
                        className='bg-gray-300 rounded-xl px-4 py-2 flex-row flex-1'
                        onPress={() => { inputRef.current?.focus() }}
                    >
                        <View className='mr-3'>
                            <Octicons name="search" size={24} color="grey" />
                        </View>
                        <TextInput
                            style={{ textAlignVertical: 'top' }}
                            onChangeText={(text) => {
                                setSearch(text);
                            }}
                            ref={inputRef}
                            value={search}
                            underlineColorAndroid="transparent"
                            placeholder="Search"
                            className='flex-1 text-lg justify-center'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='pl-4 items-center justify-center'
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
                    <View className='flex-row p-4'>
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
                                    onPress={() => handleClearFilter()}
                                    className='items-center justify-center py-2 w-20 rounded-lg ml-3'>
                                    <Text className='font-bold text-xl text-pale-blue'>Rest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView>
                <View className='px-4'>
                    {members?.map((userData, index) => {
                        if (!userData.name) {
                            return null;
                        }
                        return (
                            <MemberCard
                                key={index}
                                userData={userData}
                                navigation={navigation}
                                handleCardPress={() => handleCardPress(userData.uid!)}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    )
}

export default MembersList