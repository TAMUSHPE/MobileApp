import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, useColorScheme, TextInput } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from '@react-navigation/core'
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../context/UserContext'
import { auth } from '../../config/firebaseConfig';
import { getCommittees, getUser } from '../../api/firebaseUtils'
import { Committee } from "../../types/committees"
import CommitteeCard from './CommitteeCard'
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommitteesStackParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

const Committees = ({ navigation }: NativeStackScreenProps<CommitteesStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const [committees, setCommittees] = useState<Committee[]>([]);
    const [filteredCommittees, setFilteredCommittees] = useState<Committee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState<string>("");

    const inputRef = useRef<TextInput>(null);

    const fetchCommittees = async () => {
        setIsLoading(true);
        const response = await getCommittees();
        setCommittees(response);
        setFilteredCommittees(response); // Initialize filtered committees
        setIsLoading(false);
    }

    const fetchUserData = async () => {
        console.log("Fetching user data...");
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            if (firebaseUser) {
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            }
            else {
                console.warn("User data undefined. Data was likely deleted from Firebase.");
            }
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    const updateFilteredCommittees = (searchQuery: string) => {
        const filtered = committees.filter(committee =>
            committee.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCommittees(filtered);
    };


    useEffect(() => {
        fetchCommittees();
        fetchUserData();
    }, []);

    useEffect(() => {
        updateFilteredCommittees(search);
    }, [search, committees]);

    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchCommittees();
            }
        }, [hasPrivileges])
    );

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row px-4'>
                    <Text className={`text-4xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Committees</Text>
                </View>

                {/* Search */}
                <View className='px-4'>
                    <View className='flex-row mt-8'>
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
                                placeholder="Search Committees"
                                placeholderTextColor={"grey"}
                                className='flex-1 text-lg justify-center'
                            />
                        </TouchableOpacity>
                    </View>
                </View>


                {isLoading &&
                    <View className='mt-10 justify-center items-center'>
                        <ActivityIndicator size="small" />
                    </View>
                }

                {/* Committees Listing */}
                <View className='flex-row flex-wrap mt-10 mx-4 justify-between'>
                    {filteredCommittees.map((committee, index) => (
                        <View key={index} className='w-[46%]'>
                            <CommitteeCard committee={committee} navigation={navigation} />
                        </View>
                    ))}
                </View>

                <View className='pb-24' />
            </ScrollView>

            {/* Create Committee */}
            {hasPrivileges && (
                <TouchableOpacity
                    className='absolute bottom-0 right-0 bg-primary-blue rounded-full h-14 w-14 shadow-lg justify-center items-center m-4'
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
                    onPress={() => navigation.navigate("CommitteeEditor", { committee: undefined })}
                >
                    <Octicons name="plus" size={24} color="white" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    )
}

export default Committees;
