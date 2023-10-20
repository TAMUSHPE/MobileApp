import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { addDoc, collection, doc, serverTimestamp, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { OfficerStatus } from '../types/User';


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
                if (!auth?.currentUser?.uid) return;

                const officerStatusRef = doc(db, `/office-hours/officers-status/officers/${auth?.currentUser?.uid}`);
                const docSnap = await getDoc(officerStatusRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setIsSignedIn(data?.signedIn);
                }
            } catch (err) {
                console.error("Failed to fetch officer status:", err);
            }
        }

        getOfficerStatus();
    }, []);


    const addOfficeHourLog = async (data: OfficerStatus) => {
        const userDocCollection = collection(db, 'office-hours/officer-log/log');
        await addDoc(userDocCollection, data);
    };

    const updateOfficerStatus = async (data: OfficerStatus) => {
        const officerDoc = doc(db, `office-hours/officers-status/officers/${data.uid}`);
        return setDoc(officerDoc, { signedIn: data.signedIn }, { merge: true });
    };

    const incrementOfficeCount = async () => {
        const officeCountRef = doc(db, 'office-hours/officer-count');
        await updateDoc(officeCountRef, { "zachary-office": increment(1) });
    }

    const decrementOfficeCount = async () => {
        const officeCountRef = doc(db, 'office-hours/officer-count');
        await updateDoc(officeCountRef, { "zachary-office": increment(-1) });
    }

    const signInOut = async () => {
        const data = {
            uid: auth.currentUser?.uid!,
            signedIn: !isSignedIn,
            timestamp: serverTimestamp()
        } as OfficerStatus;

        await Promise.all([
            addOfficeHourLog(data),
            updateOfficerStatus(data),
            isSignedIn ? decrementOfficeCount() : incrementOfficeCount()
        ]);

        setIsSignedIn(!isSignedIn)
    }

    return (
        <View className='my-10 mx-7 py-8 bg-dark-navy rounded-md items-center justify-center text-center'>
            <View>
                <Text className='text-white text-xl bold'>Office Sign In </Text>
            </View>

            <TouchableOpacity
                className="mt-4 border-white border-2 rounded-lg py-4 px-8"
                onPress={() => setConfirmVisible(!confirmVisible)}
            >
                <Text className="text-white text-xl font-extrabold"> {isSignedIn ? "Sign Out" : "Sign In"} </Text>
            </TouchableOpacity>

            <Modal
                animationType="none"
                transparent={true}
                visible={confirmVisible}
                onRequestClose={() => setConfirmVisible(!confirmVisible)}
            >
                <TouchableOpacity
                    onPress={() => setConfirmVisible(false)}
                    className="h-[100%] w-[100%]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                    <View className='items-center justify-center h-full'>
                        <TouchableWithoutFeedback>
                            <View className='opacity-100 bg-white w-[70%] rounded-md items-center'>
                                <TouchableOpacity
                                    onPress={async () => {
                                        setConfirmVisible(false)
                                        signInOut()
                                    }}
                                >
                                    <Text className='text-xl font-bold py-3 px-8'> {isSignedIn ? "Sign Out" : "Sign In"} </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

export default OfficeSignIn