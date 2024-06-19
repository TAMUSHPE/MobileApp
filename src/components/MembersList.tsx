import { View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { HomeStackParams } from '../types/navigation'
import MemberCard from './MemberCard'
import { MAJORS, PublicUserInfo, UserFilter, classYears } from '../types/user';
import CustomDropDownMenu, { CustomDropDownMethods } from './CustomDropDown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserContext } from '../context/UserContext';

const MembersList: React.FC<MemberListProps> = ({ handleCardPress, users, navigation }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

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
                            style={{ textAlignVertical: 'top', color: darkMode ? 'black' : 'white' }}
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
                    {/* <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='pl-4 items-center justify-center'
                        style={{ minWidth: 45 }}
                    >
                        <Octicons name="filter" size={27} color="black" />
                    </TouchableOpacity> */}
                </View>

                {/* {showFilterMenu && (
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
                                    className='items-center justify-center bg-primary-blue py-2 w-20 rounded-lg ml-3'>
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
                                    <Text className='font-bold text-xl text-primary-blue'>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )} */}
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

export type MemberListProps = {
    handleCardPress: (uid: string) => string | void;
    users: PublicUserInfo[];
    navigation?: NativeStackNavigationProp<HomeStackParams>
}


export default MembersList