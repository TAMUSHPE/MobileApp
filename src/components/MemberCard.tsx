import { Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { MembersProps } from '../types/Navigation'

const MemberCard: React.FC<MembersProps> = ({ userData, handleOnPress, navigation }) => {
    if (!userData) {
        return
    }
    const { name, displayName, classYear, committees, roles, uid } = userData

    return (
        <TouchableOpacity className='p-7'
            onPress={handleOnPress}
        >
            <Text>{`Name:  ${name}`}</Text>
            <Text>{`Display  Name: ${displayName}`}</Text>
            <Text>{`Class Year: ${classYear}`}</Text>
            <Text>{`Committees: ${committees}`}</Text>
            <Text>{`Roles: ${JSON.stringify(roles)}`}</Text>
        </TouchableOpacity>
    )
}

export default MemberCard