import { View, Text, TouchableOpacity, Alert, Image } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Octicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AuthStackParams } from '../../types/navigation';
import { auth } from '../../config/firebaseConfig';
import TextInputWithFloatingTitle from '../../components/TextInputWithFloatingTitle';
import InteractButton from '../../components/InteractButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Images } from '../../../assets';

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
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >

            <SafeAreaView className="flex-1">
                <View className='px-4 mt-5'>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("LoginScreen")}
                        activeOpacity={1}
                    >
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="items-center">
                    <Image
                        className="flex-row h-20 w-20 mt-2 mb-14"
                        source={Images.SHPE_LOGO}
                    />
                </View>

                <View className="items-center mx-8">
                    <Text className="text-white text-center text-4xl font-bold">Reset Password</Text>
                    <Text className="text-white text-center text-lg">Enter your email, we will send you an email to reset your password.</Text>
                </View>

                <View className="mx-8 mt-10">
                    <TextInputWithFloatingTitle
                        setTextFunction={(text: string) => { setEmail(text); }}
                        inputValue={email}
                        title='Email*'
                        placeholderText='Email*'
                        titleStartY={20}
                        titleEndY={0}
                        maxCharacters={64}
                        blurTitleClassName='text-xl'
                        focusTitleClassName='text-white text-xl ml-1'
                        textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                    />

                    <InteractButton
                        onPress={() => handlePasswordReset()}
                        label="Reset Password"
                        buttonClassName="justify-center items-center bg-primary-orange mt-8 rounded-xl h-14"
                        textClassName="text-white font-semibold text-2xl"
                        underlayColor="#EF9260"
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}

export default GuestRecoveryAccount