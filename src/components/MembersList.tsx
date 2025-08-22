import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { HomeStackParams } from '../types/navigation'
import MemberCard from './MemberCard'
import { MAJORS, PublicUserInfo, UserFilter, classYears } from '../types/user';
import CustomDropDownMenu, { CustomDropDownMethods } from './CustomDropDown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserContext } from '../context/UserContext';
import { FlatList } from 'react-native';

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
            <FlatList
            data={members}
            renderItem={({item}) => {

                return(
                    <MemberCard
                    userData={item}
                    />
                )
            }}
            />
            
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