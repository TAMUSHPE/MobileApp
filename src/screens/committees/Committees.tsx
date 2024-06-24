import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Image, useColorScheme } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
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

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const [committees, setCommittees] = useState<Committee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCommittees = async () => {
        setIsLoading(true);
        const response = await getCommittees();
        setCommittees(response);
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

    useEffect(() => {
        fetchCommittees();
        fetchUserData();
    }, []);

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


                {isLoading &&
                    <View className='mt-10 justify-center items-center'>
                        <ActivityIndicator size="small" />
                    </View>
                }

                {/* Committees Listing */}
                <View className='flex-row flex-wrap mt-10 mx-4 justify-between'>
                    {committees.map((committee, index) => (
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
