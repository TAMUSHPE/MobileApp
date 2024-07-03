import React, { useContext, useEffect, useState } from 'react';
import { View, Text, AppState, TouchableOpacity, Pressable, AppStateStatus, Image } from 'react-native';
import { User, onAuthStateChanged, reload, sendEmailVerification } from 'firebase/auth';
import { Octicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { AuthStackParams } from '../../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { Images } from '../../../assets';

const GuestVerification = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [appState, setAppState] = useState(AppState.currentState);
    const { signOutUser } = useContext(UserContext)!;
    const [resend, setResend] = useState<boolean>(false);

    const checkVerification = async (user: User) => {
        await reload(user); // Refresh user data
        if (user.emailVerified) {
            navigation.navigate("ProfileSetup");
        }
    };

    const resendVerificationEmail = async () => {
        if (auth.currentUser) {
            setResend(true);
            await sendEmailVerification(auth.currentUser);
        }
    };

    // Check email verification after a user return to the app
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.match(/inactive|background/) && nextAppState === "active") {
                console.log("App has come to the foreground!");
                if (auth.currentUser) {
                    checkVerification(auth.currentUser);
                }
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener("change", handleAppStateChange);
        setResend(false);

        return () => {
            subscription.remove();
        };
    }, [appState]);


    // Check email verification on auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                checkVerification(user);
            }
        });

        return () => unsubscribe();
    }, []);


    // Check email verification on timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (auth.currentUser) {
                checkVerification(auth.currentUser);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, []);


    return (
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <SafeAreaView className="flex-1">
                {/* Header */}
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
                    <Text className="text-white text-center text-4xl font-bold">Email Verification</Text>
                </View>

                <View className="mx-8 mt-10 items-center">
                    <View className='rounded-full border-4 border-white h-36 w-36 items-center justify-center'>
                        <Octicons name="mail" size={75} color="white" />
                    </View>
                    <Text className='text-white text-center text-lg mt-4'>We sent an email to <Text className='text-primary-orange text-bold'>{auth.currentUser?.email}</Text> {"\n"}If you don't see it, you may need to check your spam folder</Text>

                </View>
                <View className='mx-8 flex-1 justify-end'>

                    {(!auth.currentUser?.emailVerified && !resend) && (
                        <Pressable
                            onPress={resendVerificationEmail}
                        >
                            <Text className="text-white text-center text-lg text-semibold">Did not receive verification email? <Text className='text-primary-orange'>Resend</Text></Text>
                        </Pressable>
                    )}

                    {resend && (
                        <Text className='text-primary-orange text-lg'>Another verification email has been resend</Text>
                    )}
                </View>


            </SafeAreaView>
        </LinearGradient>
    );
};

export default GuestVerification;
