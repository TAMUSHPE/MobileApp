import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResetOfficeHours = () => {
    const testRest = async () => {
        try {
            const functions = getFunctions();
            const resetOfficeOnCall = httpsCallable(functions, 'resetOfficeOnCall');
            await resetOfficeOnCall();
        } catch (err) {
            console.log("Error resetting office hours:", err)
        }
    }


    return (
        <SafeAreaView>
            <TouchableOpacity
                className='bg-blue-500 rounded-md p-2'
                onPress={() => testRest()}
            >
                <Text>Test Reset Office Hour</Text>
            </TouchableOpacity>

        </SafeAreaView>
    )
}

export default ResetOfficeHours