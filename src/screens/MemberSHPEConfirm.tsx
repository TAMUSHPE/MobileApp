import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { PublicUserInfo } from '../types/User'
import { getMembersToVerify, getPublicUserData } from '../api/firebaseUtils'
import MembersList from '../components/MembersList'
import { db } from '../config/firebaseConfig'
import { deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import MemberCard from '../components/MemberCard'

const MemberSHPEConfirm = () => {
    const [members, setMembers] = useState<PublicUserInfo[]>([]);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [currentConfirmMember, setCurrentConfirmMember] = useState<string>();
    const [memberDetails, setMemberDetails] = useState<memberSHPEResponse | null>(null);
    const [confirmMemberData, setConfirmMemberData] = useState<PublicUserInfo>();

    const fetchMembers = async () => {
        try {
            const fetchedMembers = await getMembersToVerify();
            setMembers(fetchedMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };
    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMemberDetails = async (userId: string) => {
        const memberDocRef = doc(db, 'memberSHPE', userId);
        const memberDocSnap = await getDoc(memberDocRef);

        if (memberDocSnap.exists()) {
            const memberData = memberDocSnap.data() as memberSHPEResponse;
            setMemberDetails(memberData);
        } else {
            console.log('No such document!');
        }
    };

    useEffect(() => {
        if (currentConfirmMember) {
            const fetchMemberData = async () => {
                try {
                    const memberData = await getPublicUserData(currentConfirmMember);
                    if (memberData) {
                        setConfirmMemberData(memberData);
                    } else {
                        console.log('No data returned for member');
                    }
                } catch (error) {
                    console.error('Error fetching member details:', error);
                }
            };
            fetchMemberData();
        }
        if (currentConfirmMember) {
            fetchMemberDetails(currentConfirmMember)
        }
    }, [currentConfirmMember]);

    const handleOpenLink = async (url: string | undefined) => {
        if (url) {
            await Linking.canOpenURL(url)
                .then(async (supported) => {
                    if (supported) {
                        await Linking.openURL(url!)
                            .catch((err) => console.error(`Issue opening url: ${err}`));
                    } else {
                        console.warn(`Don't know how to open this URL: ${url}`);
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        }
        else {
            alert("No resume found")
        }
    }

    const handleApprove = async () => {
        // Update the user's document in the 'users' collection
        const userDocRef = doc(db, 'users', currentConfirmMember!);
        await updateDoc(userDocRef, {
            chapterExpiration: memberDetails?.chapterExpiration,
            nationalExpiration: memberDetails?.nationalExpiration,
        });

        const memberDocRef = doc(db, 'memberSHPE', currentConfirmMember!);
        await deleteDoc(memberDocRef);
        await fetchMembers();
    };

    const handleDeny = async () => {
        const userDocRef = doc(db, 'users', currentConfirmMember!);

        await updateDoc(userDocRef, {
            chapterExpiration: deleteField(),
            nationalExpiration: deleteField()
        });

        const memberDocRef = doc(db, 'memberSHPE', currentConfirmMember!);
        await deleteDoc(memberDocRef);

        // Refresh the members list
        await fetchMembers();
    };

    return (
        <View className="mt-5">
            <MembersList
                handleCardPress={(uid) => {
                    setCurrentConfirmMember(uid)
                    setConfirmVisible(true)
                }}
                membersList={members}
                DEFAULT_NUM_LIMIT={null}
            />

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
                                <MemberCard userData={confirmMemberData} handleCardPress={() => { }} />
                                <TouchableOpacity
                                    className='px-6 py-4 rounded-lg  items-center bg-maroon'
                                    onPress={async () => { handleOpenLink(memberDetails?.chapterURL) }}
                                >
                                    <Text className="text-white">National Proof</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className='px-6 py-4 rounded-lg  items-center bg-dark-navy'
                                    onPress={async () => { handleOpenLink(memberDetails?.nationalURL) }}
                                >
                                    <Text className="text-white">Chapter Proof</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        handleApprove()
                                        setConfirmVisible(false);
                                    }}>
                                    <Text>Approve</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        handleDeny()
                                        setConfirmVisible(false);
                                    }}>
                                    <Text>Deny</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setConfirmVisible(false); }}>
                                    <Text>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity >
            </Modal >
        </View >
    )
}


interface memberSHPEResponse {
    chapterURL: string;
    nationalURL: string;
    chapterExpiration: string;
    nationalExpiration: string;
}

export default MemberSHPEConfirm