import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { auth, db, functions } from '../config/firebaseConfig';
import { addToWatchlist } from '../api/firebaseUtils';
import { onSnapshot, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
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
    const [lastPassTime, setLastPassTime] = useState(0)
    const DEBOUNCE_TIME = 10000; // 10 seconds

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;


    useEffect(() => {
        const officeCountRef = doc(db, "office-hours/officer-count");
        const unsubscribe = onSnapshot(officeCountRef, (doc) => {
            if (doc.exists()) {
                setOfficeCount(doc.data()["zachary-office"]);
            }
        });

        return () => unsubscribe();
    }, []);

    const knockOnWall = async () => {
        const data: MemberStatus = {
            uid: auth.currentUser?.uid!,
            timestamp: serverTimestamp()
        };
        try {
            const currentTime = Date.now();
            if (currentTime - lastPassTime >= DEBOUNCE_TIME) {
                const userDocCollection = collection(db, 'office-hours/member-log/log');
                await addDoc(userDocCollection, data);

                setLastPassTime(currentTime);

                const sendNotificationOfficeHours = httpsCallable(functions, 'sendNotificationOfficeHours');
                await sendNotificationOfficeHours({
                    userData: userInfo?.publicInfo
                });
            }
            else {
                await addToWatchlist(auth.currentUser?.uid!);
            }
        } catch (err) {
            console.error("Error sending knock:", err);
        }
    };

    return (
        <View>
            <View className='my-10 py-6 mx-7 justify-center items-center bg-[#F9F9F9] rounded-md'>
                <Text className="text-2xl text-pale-blue font-semibold">Office Hours</Text>
                <View className='w-[90%] mt-6 border-pale-blue border-4 rounded-sm'>
                    <View className='my-4 justify-center items-center text-center'>
                        <Text className='text-pale-blue text-lg'>Monday - Thursday</Text>
                        <Text className='text-pale-blue text-lg'>10am - 2pm</Text>
                        <View className='border-t-2 border-pale-blue w-[80%] my-3'></View>
                        <Text className='text-pale-blue text-lg'>Location: Zach 450 - P1</Text>
                        <Text className='text-pale-blue text-lg'>Email: tamushpe@gmail.com</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setConfirmVisible(!confirmVisible)}
                    className={`py-5 px-12 mt-10 rounded-2xl ${officeCount > 0 ? "bg-pale-blue" : "bg-[#F9F9F9]"}`}
                    activeOpacity={0.7}
                    disabled={officeCount === 0}
                >
                    <Text className={`text-2xl font-extrabold ${officeCount > 0 ? "text-white" : "text-pale-blue"}`}> {officeCount > 0 ? "Knock on Wall" : "Unavailable"} </Text>
                </TouchableOpacity>
            </View>

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
                            <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'>
                                <Octicons name="bell" size={24} color="black" />
                                <View className='flex items-center w-[80%] space-y-8'>
                                    <Text className="text-center text-lg font-bold">Are you sure you want to send a notification to officers?</Text>
                                    <View className="flex-row">
                                        <TouchableOpacity
                                            onPress={async () => {
                                                setConfirmVisible(false)
                                                knockOnWall()
                                            }}
                                            className="bg-pale-blue rounded-xl justify-center items-center"
                                        >
                                            <Text className='text-xl font-bold text-white px-3'>Send Notification</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={async () => { setConfirmVisible(false) }}>
                                            <Text className='text-xl font-bold py-3 px-8'>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity >
            </Modal>
        </View>
    )
}

export default OfficeHours;
