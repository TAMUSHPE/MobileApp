import { Text, ScrollView, View, TextInput, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { MembersProps } from '../types/Navigation'
import { PublicUserInfoUID } from '../types/User'
import MemberCard from './MemberCard'
import { TouchableOpacity } from 'react-native';

const MembersList: React.FC<MembersProps> = ({ navigation, handleCardPress, officersList, membersList, loadMoreUsers, hasMoreUserRef, filterRef, setLastUserSnapshot }) => {
    const [search, setSearch] = useState<string>("")
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [officers, setOfficers] = useState<PublicUserInfoUID[]>([])
    const [members, setMembers] = useState<PublicUserInfoUID[]>([])
    const [loading, setLoading] = useState(false);
    const [localFilter, setLocalFilter] = useState<UserFilter>({ classYear: "", major: "", orderByField: "name" });
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMembers(membersList || [])
        setOfficers(officersList || [])
    }, [membersList, officersList])

    const searchFilterFunction = (text: string) => {
        if (text) {
            let newOfficerData: PublicUserInfoUID[] = [];
            if (officers != undefined && officers.length > 0) {
                newOfficerData = officers.filter(
                    function (item) {
                        const itemData = item.name
                            ? item.name.toUpperCase()
                            : ''.toUpperCase();
                        const textData = text.toUpperCase();
                        return itemData.indexOf(textData) > -1;
                    }
                );
            }

            let newMemberData: PublicUserInfoUID[] = [];
            if (members != undefined && members.length > 0) {
                newMemberData = members.filter(
                    function (item) {
                        const itemData = item.name
                            ? item.name.toUpperCase()
                            : ''.toUpperCase();
                        const textData = text.toUpperCase();
                        return itemData.indexOf(textData) > -1;
                    }
                );
            }

            setOfficers(newOfficerData);
            setMembers(newMemberData);

            setSearch(text);
        } else {
            if (officersList != undefined && officersList.length > 0) {
                setOfficers(officersList);
            }
            if (membersList != undefined && membersList.length > 0) {
                setMembers(membersList);
            }
        }
    };

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (loadMoreUsers == undefined) return;
        if (!hasMoreUserRef?.current) return;
        const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
            const paddingToBottom = 20;
            return layoutMeasurement.height + contentOffset.y >=
                contentSize.height - paddingToBottom;
        };

        if (!isCloseToBottom(nativeEvent)) return;
        setLoading(true);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            loadMoreUsers()
            debounceTimer.current = null;
        }, 300);
    }, []);


    const handleApplyFilter = () => {
        if (setLastUserSnapshot)
            setLastUserSnapshot(null);
        if (filterRef)
            filterRef.current = localFilter;
        setShowFilterMenu(false);
    }

    const handleCLearFilter = () => {
        if (setLastUserSnapshot)
            setLastUserSnapshot(null);
        if (filterRef)
            filterRef.current = { classYear: "", major: "", orderByField: "name" };
        setShowFilterMenu(false);

    }

    return (
        <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={400}
        >
            <View className='mx-4'>
                <View>

                    <View className='flex-row  mb-4'>
                        <View className=' flex-1'>
                            <View className='bg-gray-300 rounded-xl px-4 py-2 flex-row'>
                                <View className='mr-3'>
                                    <Octicons name="search" size={24} color="grey" />
                                </View>
                                <TextInput
                                    onChangeText={(text) => searchFilterFunction(text)}
                                    value={search}
                                    underlineColorAndroid="transparent"
                                    placeholder="Search"
                                    className='text-lg text-center justify-center'
                                />
                            </View>
                        </View>
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
                                    onPress={() => handleCLearFilter()}
                                    className='items-center justify-center bg-red-600 w-14 h-10 rounded-lg'>
                                    <Text className='text-bold text-xl'>Clear</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>



                {officers.length === 0 && members.length === 0 &&
                    <Text className='text-xl mb-4 text-bold'>No users found</Text>
                }
                {officers.length != 0 &&
                    <View className='flex-row mb-4'>
                        <Text className='text-xl text-bold'>Officers </Text>
                    </View>
                }
                {officers.map((userData, index) => {
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => { handleCardPress(userData.uid!) }}
                        />
                    )
                })}

                {members.length != 0 &&
                    <View className='flex-row mb-4'>
                        <Text className='text-xl text-bold'>Members </Text>
                    </View>
                }
                {members.map((userData, index) => {
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => handleCardPress(userData.uid!)} />
                    )
                })}

                {hasMoreUserRef?.current && loading && (
                    <ActivityIndicator size={"large"} />
                )}

                {!hasMoreUserRef?.current && (
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

type UserFilter = {
    classYear: string,
    major: string,
    orderByField: string
}

export default MembersList