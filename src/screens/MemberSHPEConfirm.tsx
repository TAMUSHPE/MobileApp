import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { PublicUserInfo } from '../types/User'
import { getMembersToVerify } from '../api/firebaseUtils'
import MembersList from '../components/MembersList'

const MemberSHPEConfirm = () => {
    // get user info from memberSHPe collection
    // put into list and use membersList component to display
    // when user clicks on member, display member confirmation approve/deny modal
    // allow admin to view chapter proof and national proof
    // if approve, mark flags as true in user's document and remove from memberSHPE collection
    // if deny, remove from memberSHPE collection
    const [members, setMembers] = useState<PublicUserInfo[]>([]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const fetchedMembers = await getMembersToVerify();
                setMembers(fetchedMembers);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };

        fetchMembers();
    }, []);

    return (
        <View>
            <MembersList
                handleCardPress={(uid) => {
                    console.log(uid)
                }}
                officersList={[]}
                membersList={members}
            />
        </View>
    )
}

export default MemberSHPEConfirm