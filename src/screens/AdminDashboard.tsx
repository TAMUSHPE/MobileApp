import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { httpsCallable, getFunctions } from 'firebase/functions';



const AdminDashboard = () => {
    const updatePoints = async () => {
        const functions = getFunctions();
        const updateMemberRanks = httpsCallable(functions, 'updateMemberRanksOnCall');
        await updateMemberRanks()
    }

    return (
        <View>
            <Text>AdminDashboard</Text>
            <TouchableOpacity
                onPress={() => updatePoints()}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update Points and Rank for all Users</Text>
            </TouchableOpacity>
        </View>
    )
}

export default AdminDashboard