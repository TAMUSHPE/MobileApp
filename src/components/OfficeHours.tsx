import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, db } from '../config/firebaseConfig';
import { MemberStatus } from '../types/User';

/**
 * This component displays the office hours information and provides an interface 
 * for members to send a "knock" notification to the officers.
 * 
 * @returns Returns the rendered office hours component.
 */
const OfficeHours = () => {
    const [officeCount, setOfficeCount] = useState<number>(0);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

    useEffect(() => {
        const officeCountRef = doc(db, "office-hours/officer-count");
        const unsubscribe = onSnapshot(officeCountRef, (doc) => {
            if (doc.exists()) {
                setOfficeCount(doc.data()["zachary-office"]);
            }
        });

        return () => unsubscribe();
    }, []);

    let lastKnockTime: number = 0; //Creating the lastKnockTime

    const knockOnWall = async (data: MemberStatus) => {
        try {
            const currentTime = Date.now();
            //Checks if its been at least 10 seconds from the last knock
            //Adjust as needed
            if (currentTime - lastKnockTime >= 10000) {
                // Log Member Knock in Firestore
                const userDocCollection = collection(db, 'office-hours/member-log/log');
                await addDoc(userDocCollection, data);
    
                //If the knock is valid, the previous knock time is updated
                lastKnockTime = currentTime;
    
                // Send Notification to Officers using Firebase Functions
                const functions = getFunctions();
                const sendNotificationOfficeHours = httpsCallable(functions, 'sendNotificationOfficeHours');
                await sendNotificationOfficeHours();
            } else {
                console.log('Please wait 10 seconds before knocking again.');
            }
        } catch (err) {
            console.error("Error sending knock:", err);
        }
    };
    
    const handleKnock = () => {
        const data: MemberStatus = {
            uid: auth.currentUser?.uid!,
            timestamp: serverTimestamp()
        };
        knockOnWall(data);
    };
    
    
    return (
        <View className='my-10 py-6 mx-7 justify-center items-center bg-pale-blue rounded-md'>
            <Text className="text-2xl text-white">Office Hours</Text>
            <View className='w-[90%] mt-6 border-white border-2 rounded-sm'>
                <View className='my-4 justify-center items-center text-center'>
                    <Text className='text-white text-lg'>Monday - Thursday</Text>
                    <Text className='text-white text-lg'>10am - 2pm</Text>
                    <View className='border-t-2 border-white w-[80%] my-3'></View>
                    <Text className='text-white text-lg'>Location: Zach 450 - P1</Text>
                    <Text className='text-white text-lg'>Email: tamushpe@gmail.com</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => setConfirmVisible(!confirmVisible)}
                className="py-4 px-10 mt-10 border-white border-2 rounded-2xl"
                activeOpacity={0.7}
                disabled={officeCount === 0}
            >
                <Text className="text-white text-xl font-extrabold"> {officeCount > 0 ? "Knock on Wall" : "Unavailable"} </Text>
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
                                        handleKnock()
                                    }}
                                >
                                    <Text className='text-xl font-bold py-3 px-8'> Notify </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

export default OfficeHours;
