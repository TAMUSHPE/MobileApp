import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { HomeStackParams } from '../types/navigation'
import MemberCard from './MemberCard'
import { MAJORS, PublicUserInfo, UserFilter, classYears } from '../types/user';
import CustomDropDownMenu, { CustomDropDownMethods } from './CustomDropDown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserContext } from '../context/UserContext';

const MembersList: React.FC<MemberListProps> = ({ handleCardPress, users, navigation, canSearch = true }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [search, setSearch] = useState<string>("")
    const [filter, setFilter] = useState<UserFilter>({ major: "", classYear: "", role: "" });
    const [members, setMembers] = useState<PublicUserInfo[]>(users)
    const inputRef = useRef<TextInput>(null);

    const updateFilteredMembers = (appliedFilter: UserFilter) => {
        let filtered = users.filter(user => {
            const matchesSearch = search === "" ||
                user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(search.toLowerCase());
            const matchesMajor = appliedFilter.major === "" || user.major?.includes(appliedFilter.major);
            const matchesClassYear = appliedFilter.classYear === "" || user.classYear === appliedFilter.classYear;
            const matchesRole = appliedFilter.role === "" || (user.roles as any)?.[appliedFilter.role!] === true;


            return matchesSearch && matchesMajor && matchesClassYear && matchesRole;
        });
        setMembers(filtered);
    };

    useEffect(() => {
        updateFilteredMembers(filter);
    }, [search]);

    return (
        <View className='flex-1'>
            <ScrollView className='-z-20'>
                {/* Search */}
                {canSearch && (
                    <View className='px-4'>
                        <View className='flex-row mb-4'>
                            <TouchableOpacity
                                activeOpacity={1}
                                className={`rounded-xl px-4 py-2 flex-row flex-1 ${darkMode ? 'bg-secondary-bg-dark' : 'bg-secondary-bg-light'}`}
                                onPress={() => { inputRef.current?.focus() }}
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
                            >
                                <View className='mr-3'>
                                    <Octicons name="search" size={24} color={darkMode ? "white" : "black"} />
                                </View>
                                <TextInput
                                    style={{ textAlignVertical: 'top', color: darkMode ? 'white' : 'black' }}
                                    onChangeText={(text) => {
                                        setSearch(text);
                                    }}
                                    ref={inputRef}
                                    value={search}
                                    underlineColorAndroid="transparent"
                                    placeholder="Search"
                                    placeholderTextColor={"grey"}
                                    className='flex-1 text-lg justify-center'
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Members */}
                <View className='px-4'>
                    {members?.map((userData, index) => {
                        if (!userData.name) {
                            return null;
                        }
                        return (
                            <MemberCard
                                key={index}
                                userData={userData}
                                handleCardPress={() => {
                                    if (handleCardPress) {
                                        handleCardPress(userData.uid!);
                                    }
                                }}
                            />
                        );
                    })}
                </View>

                <View className='pb-24' />
            </ScrollView>
        </View>
    )
}

export type MemberListProps = {
    handleCardPress?: (uid: string) => string | void;
    users: PublicUserInfo[];
    navigation?: NativeStackNavigationProp<any>
    canSearch?: boolean;
}


export default MembersList