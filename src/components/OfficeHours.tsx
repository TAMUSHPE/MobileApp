import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { MemberStatus } from '../types/OfficeSIgnIn';
import { httpsCallable, getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const OfficeHours = () => {
    const [officeCount, setOfficeCount] = useState<number>(0);

    useEffect(() => {
        const officeCountRef = doc(db, "office-hour/officer-count");

        const unsubscribe = onSnapshot(officeCountRef, (doc) => {
            if (doc.exists()) {
                setOfficeCount(doc.data()["zachary-office"]);
            }
        });

        return () => unsubscribe();
    }, [db]);

    const knockOnWall = async (data: MemberStatus) => {
        // Log Member Knock
        const userDocCollection = collection(db, 'office-hour/member-log/log');
        await addDoc(userDocCollection, data)
            .catch(err => console.log(err));
        const functions = getFunctions();

        // Send Notifcation to Officer
        const sendNotificationOfficeHours = httpsCallable(functions, 'sendNotificationOfficeHours');
        await sendNotificationOfficeHours({ title: "Knock on Wall Notification", body: "Someone at the front" })
    }




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
                onPress={() => {
                    const data = {
                        uid: auth.currentUser?.uid!,
                        timestamp: serverTimestamp()
                    } as MemberStatus;
                    knockOnWall(data)
                }}
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
