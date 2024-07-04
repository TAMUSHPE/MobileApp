import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity, useColorScheme, ScrollView } from "react-native";
import React, { useRef, useCallback, useState, useContext } from "react";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import MemberCard from "./MemberCard";
import { PublicUserInfo } from "../types/user";
import DismissibleModal from "./DismissibleModal";
import { Octicons } from '@expo/vector-icons';
import { setMOTM } from "../api/firebaseUtils";
import { StatusBar } from "expo-status-bar";
import { UserContext } from "../context/UserContext";



const rightSwipeActions = () => {
    return (
        <View className="bg-primary-blue justify-center items-center px-6">
            <Text className="text-white text-xl">set MOTM</Text>
        </View>
    );
};


const SwipeableMemberCard = ({ userData, onSwipe }: { userData: PublicUserInfo, onSwipe: any }) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const swipeableRef = useRef<Swipeable | null>(null);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [invisibleConfirmModal, setInvisibleConfirmModal] = useState(false);

    const closeSwipeable = useCallback(() => {
        swipeableRef.current?.close();
    }, []);

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={rightSwipeActions}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    setConfirmVisible(true);
                    setInvisibleConfirmModal(true);
                    closeSwipeable();
                }
            }}
        >
            <View className="mx-5">
                <MemberCard
                    userData={userData}
                    displayPoints={true} />
            </View>

            <DismissibleModal
                visible={confirmVisible && invisibleConfirmModal}
                setVisible={setConfirmVisible}
            >
                <View
                    className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ width: 325 }}
                >

                    <View className='flex-row items-center justify-end'>
                        <View>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Octicons name="x" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <MemberCard userData={userData} />


                    <Text className={`text-md ${darkMode ? "text-white" : "text-black"}`}>You will be setting {userData?.name} as the member of the month.</Text>


                    <View className='mt-20 flex-row space-x-6'>
                        <TouchableOpacity
                            onPress={() => {
                                setMOTM(userData)
                                setConfirmVisible(false)
                                onSwipe(userData)
                            }}
                            className='flex-1 bg-primary-blue items-center py-2 rounded-lg justify-center'
                        >
                            <Text className='text-lg font-semibold text-white'>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setConfirmVisible(false)}
                            className='flex-1 items-center py-2 rounded-lg justify-center'
                        >
                            <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </Swipeable>
    );
};

const SwipeableMemberList = ({ userData, onSwipe }: { userData: PublicUserInfo[], onSwipe: any }) => {
    if (!userData) {
        return;
    }

    return (
        <SafeAreaView className="flex-1">
            <ScrollView className="flex-grow">
                {userData.map((item) => (
                    <SwipeableMemberCard key={item.uid} userData={item} onSwipe={onSwipe} />
                ))}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};
export default SwipeableMemberList;

