import { View, Text, TouchableOpacity, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { OfficerStatus } from '../types/OfficeSIgnIn';
import { addDoc, collection, doc, serverTimestamp, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';



const OfficeSignIn = () => {
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

    useEffect(() => {
        const getOfficerStatus = async () => {
            const officerStatusRef = doc(db, `/office-hour/officers-status/officers/${auth?.currentUser?.uid}`);

            const docSnap = await getDoc(officerStatusRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return data?.signedIn;
            }
        }

        getOfficerStatus().then((status: boolean | undefined) => {
            setIsSignedIn(status)
        })
    }, []);


    const addOfficeHourLog = async (data: OfficerStatus) => {
        const userDocCollection = collection(db, 'office-hour/officer-log/log');
        await addDoc(userDocCollection, data)
            .catch(err => console.log(err));
    };

    const updateOfficerStatus = async (data: OfficerStatus) => {
        const officerDoc = doc(db, `office-hour/officers-status/officers/${data.uid}`);
        return setDoc(officerDoc, { signedIn: data.signedIn }, { merge: true });
    };

    const incrementOfficeCount = async () => {
        const officeCountRef = doc(db, 'office-hour/officer-count');
        await updateDoc(officeCountRef, {
            "zachary-office": increment(1)
        });
    }

    const decrementOfficeCount = async () => {
        const officeCountRef = doc(db, 'office-hour/officer-count');
        await updateDoc(officeCountRef, {
            "zachary-office": increment(-1)
        });
    }

    const signInOut = async () => {
        const data = {
            uid: auth.currentUser?.uid!,
            signedIn: !isSignedIn,
            timestamp: serverTimestamp()
        } as OfficerStatus;
        addOfficeHourLog(data)
        updateOfficerStatus(data)
        isSignedIn ? decrementOfficeCount() : incrementOfficeCount()
        setIsSignedIn(!isSignedIn)
    }

    return (
        <View className='my-10 mx-7 py-8 bg-dark-navy rounded-md items-center justify-center text-center'>
            <View className=''>
                <Text className='text-white text-xl bold'>Office Sign In </Text>
            </View>

            <TouchableOpacity
                onPress={() => {
                    setConfirmVisible(!confirmVisible)
                }
                }
            >
                <Text className="mt-4 text-white text-xl font-extrabold border-white border-2 rounded-lg py-4 px-8">
                    {isSignedIn ? "Sign Out" : "Sign In"}
                </Text>
            </TouchableOpacity>

            <Modal
                animationType="none"
                transparent={true}
                visible={confirmVisible}
                onRequestClose={() => {
                    setConfirmVisible(!confirmVisible);
                }}
            >
                <View className='absolute bottom-0 w-full bg-pale-orange px-16 h-16'>
                    <View className='flex-row justify-between items-center text-cente h-full'>
                        <TouchableOpacity
                            onPress={async () => {
                                setConfirmVisible(false)
                                signInOut()
                            }
                            }
                        >
                            <Text className='bg-blue'>
                                {isSignedIn ? "Sign Out" : "Sign In"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setConfirmVisible(false)
                            }
                            }>
                            <Text >Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

export default OfficeSignIn