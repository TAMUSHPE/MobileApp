import { Text, ScrollView, View, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { getMembersExcludeOfficers, getOfficers } from '../api/firebaseUtils'
import { MembersProps } from '../types/Navigation'
import { PublicUserInfoUID } from '../types/User'
import MemberCard from './MemberCard'
import { TouchableOpacity } from 'react-native';

const MembersList: React.FC<MembersProps> = ({ navigation, handleCardPress, officersList, membersList }) => {
    const [search, setSearch] = useState<string>("")
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [officers, setOfficers] = useState<PublicUserInfoUID[]>([])
    const [members, setMembers] = useState<PublicUserInfoUID[]>([])

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

    return (
        <ScrollView>
            <View className='mx-4'>
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
                        {showFilterMenu &&
                            <View className='bg-blue-400'>
                                <Text>Test</Text>
                            </View>
                        }
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFilterMenu(!showFilterMenu)}
                        className='pl-4 items-center justify-center'
                    >
                        <Octicons name="filter" size={27} color="black" />
                    </TouchableOpacity>
                </View>




                {officers.length === 0 && members.length === 0 &&
                    <Text className='text-xl mb-4 text-bold'>No users found</Text>
                }
                {officers.length != 0 &&
                    <View className='flex-row mb-4'>
                        <Text className='text-xl text-bold'>Officers </Text>
                        <Text className='text-lg  text-grey'>({officers.length})</Text>
                    </View>
                }
                {officers.map((userData, index) => {
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => handleCardPress(userData.uid!)} />
                    )
                })}

                {members.length != 0 &&
                    <View className='flex-row mb-4'>
                        <Text className='text-xl text-bold'>Members </Text>
                        <Text className='text-lg  text-grey'>({members.length})</Text>
                    </View>
                }
                {members.map((userData, index) => {

                    const handleOnPress = () => {
                        navigation!.navigate("PublicProfile", { uid: userData.uid! })
                    }
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => handleCardPress(userData.uid!)} />
                    )
                })}
            </View>
        </ScrollView>
    )
}

export default MembersList