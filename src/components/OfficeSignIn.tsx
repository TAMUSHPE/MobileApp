import { View, Text, TouchableOpacity, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { OfficerStatus } from '../types/OfficerSIgnIn';
import { addDoc, collection, doc, query, serverTimestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';



const OfficeSignIn = () => {
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

    useEffect(() => {
        const q = query(
            collection(db, "events/office-hour-log", auth.currentUser?.uid!),
            orderBy("timestamp", "desc"),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                setIsSignedIn(doc.data().signedIn)
            });
        });

        return () => unsubscribe();
    }, []);

    const addOfficeHourLog = async (data: OfficerStatus) => {
        const userDocRef = doc(db, 'events', 'office-hour-log');
        const userCollectionRef = collection(userDocRef, auth.currentUser?.uid!);
        await addDoc(userCollectionRef, data)
            .catch(err => console.log(err));
    };

    return (
        <View className='my-10 mx-7 py-8 bg-dark-navy rounded-md items-center justify-center text-center'>
            <View className=''>
                <Text className='text-white text-xl bold'>Office Sign In </Text>
            </View>

            <TouchableOpacity
                onPress={() => {
                    // setIsSignedIn(!isSignedIn)
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
                                console.log("before", isSignedIn)
                                addOfficeHourLog({
                                    signedIn: !isSignedIn,
                                    timestamp: serverTimestamp()
                                })
                                setIsSignedIn(isSignedIn)
                                console.log("after", isSignedIn)
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