import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, db } from '../config/firebaseConfig';
import { MemberStatus } from '../types/OfficeSignIn';

/**
 * This component displays the office hours information and provides an interface 
 * for members to send a "knock" notification to the officers.
 * 
 * @returns Returns the rendered office hours component.
 */
const OfficeHours = () => {
    const [officeCount, setOfficeCount] = useState<number>(0);

    useEffect(() => {
        const officeCountRef = doc(db, "office-hours/officer-count");
        const unsubscribe = onSnapshot(officeCountRef, (doc) => {
            if (doc.exists()) {
                setOfficeCount(doc.data()["zachary-office"]);
            }
        });

        return () => unsubscribe();
    }, []);


    const knockOnWall = async (data: MemberStatus) => {
        try {
            // Log Member Knock in Firestore
            const userDocCollection = collection(db, 'office-hours/member-log/log');
            await addDoc(userDocCollection, data);

            // Send Notification to Officers using Firebase Functions
            const functions = getFunctions();
            const sendNotificationOfficeHours = httpsCallable(functions, 'sendNotificationOfficeHours');
            await sendNotificationOfficeHours();
        } catch (err) {
            console.error("Error sending knock:", err);
        }
    }

    const handleKnock = () => {
        if (auth.currentUser) {
            const data: MemberStatus = {
                uid: auth.currentUser.uid,
                timestamp: serverTimestamp()
            };
            knockOnWall(data);
        }
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
                onPress={() => handleKnock()}
                className="py-4 px-10 mt-10 border-white border-2 rounded-2xl"
                activeOpacity={0.7}
                disabled={officeCount === 0}
            >
                <Text className="text-2xl text-white font-extrabold">{officeCount > 0 ? "Knock on Wall" : "Unavailable"}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default OfficeHours;
