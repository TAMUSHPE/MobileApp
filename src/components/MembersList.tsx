import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { getMembersExcludeOfficers, getOfficers } from '../api/firebaseUtils'
import { MembersProps } from '../types/Navigation'
import { PublicUserInfo, PublicUserInfoUID } from '../types/User'
import MemberCard from './MemberCard'

const MembersList: React.FC<MembersProps> = ({ navigation }) => {
    const [officers, setOfficers] = useState<PublicUserInfoUID[]>([])
    const [members, setMembers] = useState<PublicUserInfoUID[]>([])

    useEffect(() => {
        getOfficers().then((officers) => {
            setOfficers(officers)
        })
        getMembersExcludeOfficers().then((members) => {
            setMembers(members)
        })
    }, [])

    return (
        <View>
            <Text>Offices:</Text>
            {officers.map((userData, index) => (
                <MemberCard key={index} userData={userData} navigation={navigation} />
            ))}

            <Text>Members:</Text>

            {members.map((userData, index) => (
                <MemberCard key={index} userData={userData} navigation={navigation} />
            ))}
        </View>
    )
}

export default MembersList