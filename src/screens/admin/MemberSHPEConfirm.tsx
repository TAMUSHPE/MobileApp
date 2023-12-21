import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { db, functions } from '../../config/firebaseConfig'
import { getMembersToVerify, getPublicUserData } from '../../api/firebaseUtils'
import { deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { handleLinkPress } from '../../helpers/links'
import { PublicUserInfo } from '../../types/User'
import MemberCard from '../../components/MemberCard'
import DismissibleModal from '../../components/DismissibleModal'
import MembersList from '../../components/MembersList'

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

    const handleApprove = async () => {
        const userDocRef = doc(db, 'users', currentConfirmMember!);
        await updateDoc(userDocRef, {
            chapterExpiration: memberDetails?.chapterExpiration,
            nationalExpiration: memberDetails?.nationalExpiration,
        });


        const memberDocRef = doc(db, 'memberSHPE', currentConfirmMember!);
        await deleteDoc(memberDocRef);
        await fetchMembers();

        console.log(JSON.stringify(confirmMemberData, null, 2), "data send")
        console.log(currentConfirmMember, "uid")

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
        await sendNotificationToMember({
            uid: currentConfirmMember,
            type: "approved",
        });
    };


    const handleDeny = async () => {
        const userDocRef = doc(db, 'users', currentConfirmMember!);

        await updateDoc(userDocRef, {
            chapterExpiration: deleteField(),
            nationalExpiration: deleteField()
        });

        const memberDocRef = doc(db, 'memberSHPE', currentConfirmMember!);
        await deleteDoc(memberDocRef);

        await fetchMembers();

        const sendNotificationToMember = httpsCallable(functions, 'sendNotificationMemberSHPE');
        await sendNotificationToMember({
            uid: currentConfirmMember,
            type: "denied",
        });

        // Refresh the members list
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

            <DismissibleModal
                visible={confirmVisible}
                setVisible={setConfirmVisible}
            >

                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'>
                    <MemberCard userData={confirmMemberData} handleCardPress={() => { }} />
                    <TouchableOpacity
                        className='px-6 py-4 rounded-lg  items-center bg-maroon'
                        onPress={async () => { handleLinkPress(memberDetails?.chapterURL!) }}
                    >
                        <Text className="text-white">National Proof</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='px-6 py-4 rounded-lg  items-center bg-dark-navy'
                        onPress={async () => { handleLinkPress(memberDetails?.nationalURL!) }}
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
            </DismissibleModal>
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