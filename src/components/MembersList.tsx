import { Text, ScrollView, View, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Octicons } from '@expo/vector-icons';
import { getMembersExcludeOfficers, getOfficers } from '../api/firebaseUtils'
import { MembersProps } from '../types/Navigation'
import { PublicUserInfo } from '../types/User'
import MemberCard from './MemberCard'
import { TouchableOpacity } from 'react-native';

const MembersList: React.FC<MembersProps> = ({ navigation, handleCardPress }) => {
    const [officers, setOfficers] = useState<PublicUserInfo[]>([])
    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [search, setSearch] = useState<string>("")
    const [filteredOfficers, setFilteredOfficers] = useState<PublicUserInfo[]>([])
    const [filteredMembers, setFilteredMembers] = useState<PublicUserInfo[]>([])

    useEffect(() => {
        getOfficers().then((officers) => {
            setOfficers(officers)
            setFilteredOfficers(officers)
        })
        getMembersExcludeOfficers().then((members) => {
            setMembers(members)
            setFilteredMembers(members)
        })
    }, [])

    const searchFilterFunction = (text: string) => {
        if (text) {
            const newOfficerData = officers.filter(
                function (item) {
                    const itemData = item.name
                        ? item.name.toUpperCase()
                        : ''.toUpperCase();
                    const textData = text.toUpperCase();
                    return itemData.indexOf(textData) > -1;
                }
            );

            const newMemberData = members.filter(
                function (item) {
                    const itemData = item.name
                        ? item.name.toUpperCase()
                        : ''.toUpperCase();
                    const textData = text.toUpperCase();
                    return itemData.indexOf(textData) > -1;
                }
            );
            setFilteredOfficers(newOfficerData);
            setFilteredMembers(newMemberData);

            setSearch(text);
        } else {
            setFilteredOfficers(officers);
            setFilteredMembers(members);
            setSearch(text);
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




                {filteredOfficers.length === 0 && filteredMembers.length === 0 &&
                    <Text className='text-xl mb-4 text-bold'>No users found</Text>
                }
                {filteredOfficers.length != 0 &&
                    <View className='flex-row mb-4'>
                        <Text className='text-xl text-bold'>Officers </Text>
                        <Text className='text-lg  text-grey'>({filteredOfficers.length})</Text>
                    </View>
                }
                {filteredOfficers.map((userData, index) => {
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => handleCardPress(userData.uid!)} />
                    )
                })}

                {filteredMembers.length != 0 &&
                    <View className='flex-row mb-4'>
                        <Text className='text-xl text-bold'>Members </Text>
                        <Text className='text-lg  text-grey'>({filteredMembers.length})</Text>
                    </View>
                }
                {filteredMembers.map((userData, index) => {

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