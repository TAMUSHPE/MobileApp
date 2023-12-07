import { Text, ScrollView, View, TextInput, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { MembersProps } from '../types/Navigation'
import { PublicUserInfo, UserFilter } from '../types/User'
import MemberCard from './MemberCard'
import { TouchableOpacity } from 'react-native';


const MembersList: React.FC<MembersProps> = ({ navigation, handleCardPress, officersList, membersList, loadMoreUsers, hasMoreUser, filter, setFilter, setLastUserSnapshot, canSearch, numLimit, setNumLimit, loading, DEFAULT_NUM_LIMIT = 10 }) => {
    const [search, setSearch] = useState<string>("")
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [officers, setOfficers] = useState<PublicUserInfo[] | null>(null)
    const [members, setMembers] = useState<PublicUserInfo[] | null>(null)
    const [localFilter, setLocalFilter] = useState<UserFilter>(filter!);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<TextInput>(null);
    const [wait, setWait] = useState(false);

    useEffect(() => {
        if (!loading) {
            searchFilterFunction(search);
        }
    }, [loading]);

    useEffect(() => {
        if (officersList) {
            setOfficers(officersList);
        }
        if (membersList) {
            setMembers(membersList);
        }
    }, [membersList, officersList]);

    useEffect(() => {
        if (search == "") {
            if (setLastUserSnapshot)
                setLastUserSnapshot(null);
            if (setFilter)
                setFilter(localFilter)
            setShowFilterMenu(false);
            if (setNumLimit)
                setNumLimit(DEFAULT_NUM_LIMIT);
        }
    }, [search])

    const resetList = () => {
        if (setLastUserSnapshot)
            setLastUserSnapshot(null);
        if (setFilter)
            setFilter({ classYear: "", major: "", orderByField: "name" })
        setLocalFilter({ classYear: "", major: "", orderByField: "name" });
        setShowFilterMenu(false);
        if (setNumLimit)
            setNumLimit(DEFAULT_NUM_LIMIT);
    }

    const searchFilterFunction = (text: string) => {
        const textData = text.toUpperCase();

        const filterByFields = (item: PublicUserInfo) => {
            const itemName = item.name ? item.name.toUpperCase() : '';
            const itemDisplayName = item.displayName ? item.displayName.toUpperCase() : '';
            return itemName.includes(textData) || itemDisplayName.includes(textData);
        };

        const newOfficerData = officersList?.filter(filterByFields) ?? [];
        const newMemberData = membersList?.filter(filterByFields) ?? [];

        setOfficers(newOfficerData);
        setMembers(newMemberData);
    };


    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (loadMoreUsers == undefined) return;
        if (!hasMoreUser) return;
        if (search != "") return;

        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent)) return;

        setWait(true);
    }, [search, loadMoreUsers]);

    useEffect(() => {
        if (wait) {
            const timer = setTimeout(() => {
                if (loadMoreUsers)
                    loadMoreUsers();
                setWait(false);
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [wait, loadMoreUsers]);


    const handleApplyFilter = () => {
        if (setLastUserSnapshot)
            setLastUserSnapshot(null);
        if (setFilter)
            setFilter(localFilter)
        setShowFilterMenu(false);
    }
    return (
        <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={400}
        >
            <View className='mx-4'>
                {canSearch && (
                    <View>
                        <View className='flex-row  mb-4'>
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
                                    ref={inputRef}
                                    onChangeText={(text) => {
                                        setSearch(text);
                                        if (numLimit == null) {
                                            // This is used after one character is typed in the search bar
                                            // and does local searching
                                            searchFilterFunction(text);
                                        } else {
                                            // By setting this to null we are telling a useEffect in Members.tsx to grab
                                            // all user data again so that it can be used for searching
                                            if (setNumLimit)
                                                setNumLimit(null);
                                        }

                                    }}
                                    value={search}
                                    underlineColorAndroid="transparent"
                                    placeholder="Search"
                                    className='text-lg text-center justify-center'
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowFilterMenu(!showFilterMenu)}
                                className='pl-4 items-center justify-center'
                            >
                                <Octicons name="filter" size={27} color="black" />
                            </TouchableOpacity>
                        </View>
                        {showFilterMenu && (
                            <View className='flex-row p-4'>
                                <View>
                                    <TextInput
                                        value={localFilter?.classYear}
                                        onChangeText={(text) => setLocalFilter({ ...localFilter, classYear: text })}
                                        placeholder="classYear"
                                        className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4 mb-4'
                                    />
                                    <TextInput
                                        value={localFilter?.major}
                                        onChangeText={(text) => setLocalFilter({ ...localFilter, major: text })}
                                        placeholder="Major"
                                        className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2 mr-4 mb-4'
                                    />

                                    <Text>OrderBy:(name/points)</Text>
                                    <TextInput
                                        value={localFilter?.orderByField}
                                        onChangeText={(text) => setLocalFilter({ ...localFilter, orderByField: text })}
                                        placeholder="OrderBy"
                                        className='bg-white border-black border-2 rounded-md text-xl w-28 py-1 pl-2'
                                    />
                                </View>
                                <View>
                                    <TouchableOpacity
                                        onPress={() => handleApplyFilter()}
                                        className='items-center justify-center bg-pale-blue w-14 h-10 rounded-lg'>
                                        <Text className='text-bold text-xl'>Apply</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            resetList()
                                            setSearch("");
                                        }}
                                        className='items-center justify-center bg-red-600 w-14 h-10 rounded-lg'>
                                        <Text className='text-bold text-xl'>Clear</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {!loading && officers?.map((userData, index) => {
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => { handleCardPress(userData.uid!) }}
                        />
                    )
                })}

                {!loading && members?.map((userData, index) => {
                    if (!userData.name) {
                        return null; // this is a hacky fix for user that have not completed registration
                    }
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => handleCardPress(userData.uid!)}
                        />
                    );
                })
                }

                {loading && (
                    <View className='pb-6 items-center justify-center'>
                        <ActivityIndicator size="large" />
                    </View>
                )}

                {(!hasMoreUser && !loading) && (
                    <View className='pb-6 items-center justify-center'>
                        <Text>
                            End of Users
                        </Text>
                    </View>
                )}


                <Text className='pb-20'></Text>
            </View>
        </ScrollView>
    )
}

export default MembersList