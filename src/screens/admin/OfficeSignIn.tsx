import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Octicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';
import { serverTimestamp } from 'firebase/firestore';
import { OfficerStatus } from '../../types/User';
import DismissibleModal from '../../components/DismissibleModal';
import { addOfficeHourLog, decrementOfficeCount, fetchOfficerStatus, incrementOfficeCount, updateOfficerStatus } from '../../api/firebaseUtils';

/**
 * Provides an interface for officers to sign in and out of office hours.
 * It displays the current sign-in status using Firestore status, presents a modal for confirmation,
 * and updates the Firestore with sign-in or sign-out actions.
 * 
 * @returns The rendered OfficeSignIn component.
 */
const OfficeSignIn = () => {
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

    useEffect(() => {
        const getOfficerStatus = async () => {
            try {
                const status = await fetchOfficerStatus(auth.currentUser?.uid!);
                setIsSignedIn(status?.signedIn || false);
            } catch (err) {
                console.error("Failed to fetch officer status:", err);
            }
        }
        getOfficerStatus();
    }, []);


    const signInOut = async () => {
        try {
            const data = {
                uid: auth.currentUser?.uid!,
                signedIn: !isSignedIn,
                timestamp: serverTimestamp()
            } as OfficerStatus;

            await addOfficeHourLog(data);
            await updateOfficerStatus(data);

            if (isSignedIn) {
                await decrementOfficeCount();
            } else {
                await incrementOfficeCount();
            }

            setIsSignedIn(!isSignedIn);
        } catch (error) {
            console.error("Error during sign-in/out process:", error);
        }
    }

    return (
        <View className='mt-10 mx-7 py-8 bg-white rounded-md items-center justify-center text-center shadow-md shadow-slate-300'>
            <View>
                <Text className='text-xl font-bold text-pale-blue'>Office Hours Sign In </Text>
            </View>

            <TouchableOpacity
                className="mt-4 rounded-lg py-4 px-8 bg-pale-blue"
                onPress={() => setConfirmVisible(!confirmVisible)}
            >
                <Text className=" text-xl font-extrabold text-white"> {isSignedIn ? "Sign Out" : "Sign In"} </Text>
            </TouchableOpacity>

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'>
                    <Octicons name="bell" size={24} color="black" />
                    <View className='flex items-center w-[80%] space-y-8'>
                        <Text className="text-center text-lg font-bold"> {isSignedIn ? "Are you sure you want to sign out?" : "You will receive notifications from members. Are you sure you want to sign in?"}</Text>
                        <View className="flex-row">
                            <TouchableOpacity onPress={async () => { setConfirmVisible(false) }} >
                                <Text className='text-xl font-bold py-3 px-8'> Cancel </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    setConfirmVisible(false)
                                    signInOut()
                                }}
                                className="bg-pale-blue rounded-xl justify-center items-center ml-1"
                            >
                                <Text className='text-xl font-bold px-6 text-white'> {isSignedIn ? "Sign Out" : "Sign In"} </Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </View>
            </DismissibleModal>
        </View>
    )
}

export default OfficeSignIn