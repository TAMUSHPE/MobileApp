import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { MemberListProps } from '../types/navigation'
import MemberCard from './MemberCard'
import { MAJORS, PublicUserInfo, UserFilter, classYears } from '../types/user';
import CustomDropDownMenu, { CustomDropDownMethods } from './CustomDropDown';

const MembersList: React.FC<MemberListProps> = ({ handleCardPress, users, navigation }) => {
    const [search, setSearch] = useState<string>("")
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filter, setFilter] = useState<UserFilter>({ major: "", classYear: "", role: "" });
    const [members, setMembers] = useState<PublicUserInfo[]>(users)
    const inputRef = useRef<TextInput>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropDownRefYear = useRef<CustomDropDownMethods>(null);
    const dropDownRefMajor = useRef<CustomDropDownMethods>(null);
    const dropDownRefRole = useRef<CustomDropDownMethods>(null);

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

    const handleApplyFilter = async () => {
        updateFilteredMembers(filter);
    };

    const handleClearFilter = async () => {
        handleClearAllSelections();
        setFilter({ major: "", classYear: "", role: "" });
        updateFilteredMembers({ major: "", classYear: "", role: "" });
        setSearch("");
    };

    const handleClearAllSelections = () => {
        dropDownRefYear.current?.clearSelection();
        dropDownRefMajor.current?.clearSelection();
        dropDownRefRole.current?.clearSelection();
    };

    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
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
                        <Octicons name="filter" size={27} color="black" />
                    </TouchableOpacity>
                </View>

                {showFilterMenu && (
                    <View className='flex-row py-4'>
                        <View className='flex-1 space-y-4'>
                            <View className='justify-start flex-row z-10'>
                                <CustomDropDownMenu
                                    data={classYears}
                                    onSelect={(item) => setFilter({ ...filter, classYear: item.iso || "" })}
                                    searchKey="year"
                                    label="Class Year"
                                    isOpen={openDropdown === 'year'}
                                    onToggle={() => toggleDropdown('year')}
                                    displayType='iso'
                                    ref={dropDownRefYear}
                                    disableSearch
                                    containerClassName='mr-1'
                                />
                                <CustomDropDownMenu
                                    data={MAJORS}
                                    onSelect={(item) => setFilter({ ...filter, major: item.iso || "" })}
                                    searchKey="major"
                                    label="Major"
                                    isOpen={openDropdown === 'major'}
                                    onToggle={() => toggleDropdown('major')}
                                    displayType='iso'
                                    ref={dropDownRefMajor}
                                    containerClassName='ml-1'
                                />
                                <TouchableOpacity
                                    onPress={() => handleApplyFilter()}
                                    className='items-center justify-center bg-pale-blue py-2 w-20 rounded-lg ml-3'>
                                    <Text className='text-white font-bold text-xl'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            <View className='justify-start flex-row'>
                                <CustomDropDownMenu
                                    data={ROLESDROPDOWN}
                                    onSelect={(item) => setFilter({ ...filter, role: item.iso || "" })}
                                    searchKey="role"
                                    label="Role"
                                    isOpen={openDropdown === 'role'}
                                    onToggle={() => toggleDropdown('role')}
                                    displayType='value'
                                    ref={dropDownRefRole}
                                    disableSearch
                                    containerClassName='mr-2'
                                    dropDownClassName='h-44'
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

            <ScrollView className='-z-20'>
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

const ROLESDROPDOWN = [
    { role: 'Officer', iso: 'officer' },
    { role: 'Representative', iso: 'representative' },
    { role: 'Lead', iso: 'lead' },
];


export default MembersList