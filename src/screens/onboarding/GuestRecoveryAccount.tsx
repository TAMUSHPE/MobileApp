import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AuthStackParams } from '../../types/Navigation';
import { auth } from '../../config/firebaseConfig';
import TextInputWithFloatingTitle from '../../components/TextInputWithFloatingTitle';
import InteractButton from '../../components/InteractButton';

const GuestRecoveryAccount = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [email, setEmail] = useState('');

    const handlePasswordReset = async () => {
        if (email === '') {
            Alert.alert('Please enter your email address');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert(
                "Check your email",
                "A link to reset your password has been sent to your email address."
            );
        } catch (error) {
            console.error("Password reset error:", error);
            Alert.alert("Error", "Failed to send password reset email.");
        }
    };


    return (
        <SafeAreaView className='flex-1 bg-dark-navy py-10 px-8 w-screen' edges={["top"]}>
            <TouchableOpacity
                className="mb-4"
                onPress={() => {
                    navigation.navigate("LoginGuest");
                }}
            >
                <Octicons name="chevron-left" size={30} color="white" />
            </TouchableOpacity>



            <View className='flex-col px-7'>
                <Text className='text-white text-center text-3xl'>Reset Password</Text>
                <Text className="text-xl text-white mb-8">Please enter your email we will send you an email to reset your password</Text>
                <TextInputWithFloatingTitle
                    setTextFunction={(text: string) => { setEmail(text); }}
                    inputValue={email}
                    title='Email*'
                    placeholderText='Email*'
                    titleStartY={20}
                    titleEndY={0}
                    maxCharacters={64}
                    blurTitleClassName='text-white text-md'
                    focusTitleClassName='text-white pl-1 pb-1 text-xl'
                    textInputClassName="w-full rounded-md px-2 py-1 pb-3 bg-white h-6 items-center h-10 text-lg mb-4"
                />

                <InteractButton
                    onPress={async () => {
                        handlePasswordReset();
                    }}
                    label='Reset Password'
                    buttonClassName="bg-continue-dark justify-center items-center rounded-md"
                    textClassName="text-white text-lg font-bold"
                    opacity={0.8}
                    underlayColor="#A22E2B"
                />
            </View>
        </SafeAreaView>
    )
}

export default GuestRecoveryAccount