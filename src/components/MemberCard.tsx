import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { MembersProps } from '../types/Navigation'

const MemberCard: React.FC<MembersProps> = ({ userData, navigation }) => {
    if (!userData) {
        return
    }
    const { name, displayName, classYear, committees, roles, uid } = userData

    return (
        <TouchableOpacity className='flex-row space-x-5 bg-blue-400 p-7'
            onPress={() => { navigation.navigate("PublicProfile", { uid: uid! }) }}
        >
            <Text>{name}</Text>
            <Text>{displayName}</Text>
            <Text>{classYear}</Text>
            <Text>{committees}</Text>
        </TouchableOpacity>
    )
}

export default MemberCard