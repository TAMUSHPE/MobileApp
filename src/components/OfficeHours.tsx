import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
const OfficeHours = () => {
    const [officeCount, setOfficeCount] = useState<number>(0);

    useEffect(() => {
        const officeCountRef = doc(db, "office-status", "officer-count");

        const unsubscribe = onSnapshot(officeCountRef, (doc) => {
            if (doc.exists()) {
                console.log(doc.data()["zachary-office"])
                setOfficeCount(doc.data()["zachary-office"]);
            }
        });

        return () => unsubscribe();
    }, [db]);

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
                onPress={() => { }}
                className="py-4 px-10 mt-10 border-white border-2 rounded-2xl"
                activeOpacity={0.7}
            >
                <Text className="text-2xl text-white font-extrabold">{officeCount > 0 ? "Knock on Wall" : "Unavailable"}</Text>
            </TouchableOpacity>

        </View>
    )
}

export default OfficeHours;
