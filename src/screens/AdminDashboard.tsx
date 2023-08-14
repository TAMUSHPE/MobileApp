import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { httpsCallable, getFunctions } from 'firebase/functions';



const AdminDashboard = () => {
    const updateRanks = async () => {
        const functions = getFunctions();
        const updateRanksOnCall = httpsCallable(functions, 'updateRanksOnCall');
        await updateRanksOnCall()
    }

    return (
        <View>
            <Text>AdminDashboard</Text>
            <TouchableOpacity
                onPress={() => updateRanks()}
                className='bg-blue-500 rounded-md p-2'
            >
                <Text>Update Points and Rank for all Users</Text>
            </TouchableOpacity>
        </View>
    )
}

export default AdminDashboard