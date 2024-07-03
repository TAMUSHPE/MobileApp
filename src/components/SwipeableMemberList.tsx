import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity } from "react-native";
import React, { useRef, useCallback, useState } from "react";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import MemberCard from "./MemberCard";
import { PublicUserInfo } from "../types/user";
import DismissibleModal from "./DismissibleModal";
import { Octicons } from '@expo/vector-icons';
import { setMOTM } from "../api/firebaseUtils";
import { StatusBar } from "expo-status-bar";


const Separator = () => <View style={styles.itemSeparator} />;


const rightSwipeActions = () => {
    return (
        <View style={styles.rightSwipe}>
            <Text style={styles.rightSwipeText}>Set New MOTM</Text>
        </View>
    );
};


// Swipeable Member Card 
const SwipeableMemberCard = ({ userData, onSwipe }: { userData: PublicUserInfo, onSwipe: any }) => {
    // Create a ref for the Swipeable component
    const swipeableRef = useRef<Swipeable | null>(null);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [invisibleConfirmModal, setInvisibleConfirmModal] = useState(false);

    // Function to close the Swipeable manually
    const closeSwipeable = useCallback(() => {
        swipeableRef.current?.close();
    }, []);

    return (
        <Swipeable
            ref={swipeableRef} // Assign the ref here
            renderRightActions={rightSwipeActions}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    setConfirmVisible(true);
                    setInvisibleConfirmModal(true);
                    closeSwipeable();
                }
            }}
        >


            <MemberCard
                userData={userData}
                displayPoints={true} />

            <DismissibleModal
                visible={confirmVisible && invisibleConfirmModal}
                setVisible={setConfirmVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="alert" size={24} color="black" />
                            <Text className='text-xl font-semibold ml-2'>Confirm Member</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className='flex-row justify-around'>
                        <TouchableOpacity
                            className='bg-[#AEF359] w-[40%] items-center py-2 rounded-md'
                            onPress={() => {
                                setMOTM(userData)
                                setConfirmVisible(false)
                                onSwipe(userData)
                            }}
                        >
                            <Text className='font-semibold text-lg'>Confirm</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className='w-[40%] items-center py-2 rounded-md'
                            onPress={() => setConfirmVisible(false)}
                        >
                            <Text className='font-semibold text-lg'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </Swipeable>
    );
};

// Main component
const SwipeableMemberList = ({ userData, onSwipe }: { userData: PublicUserInfo[], onSwipe: any }) => {
    return (
        <>
            <StatusBar />
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={userData}
                    keyExtractor={(item) => item.uid!}
                    renderItem={({ item }) => <SwipeableMemberCard userData={item} onSwipe={onSwipe} />}
                    ItemSeparatorComponent={Separator}
                />
            </SafeAreaView>
        </>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        marginHorizontal: 13
    },
    title: {
        textAlign: 'center',
        marginVertical: 20,
    },
    itemSeparator: {
        backgroundColor: '#444',
    },
    rightSwipe: {
        backgroundColor: '#ff8303',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    rightSwipeText: {
        color: '#1b1a17',
        paddingHorizontal: 10,
        fontWeight: '600',
        paddingVertical: 20,
    },
});

export default SwipeableMemberList;

