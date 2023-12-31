import React, { useContext, useEffect, useState } from 'react';
import { View, Text, AppState, TouchableOpacity, Pressable } from 'react-native';
import { User, onAuthStateChanged, reload, sendEmailVerification } from 'firebase/auth';
import { Octicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { AuthStackParams } from '../../types/Navigation';

const GuestVerification = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [appState, setAppState] = useState(AppState.currentState);
    const { signOutUser } = useContext(UserContext)!;
    const [resend, setResend] = useState<boolean>(false);

    const checkVerification = async (user: User) => {
        await reload(user); // Refresh user data
        if (user.emailVerified) {
            console.log("Email is verified");
            navigation.navigate("ProfileSetup");
        } else {
            console.log("Email is not verified");
        }
    };

    const resendVerificationEmail = async () => {
        if (auth.currentUser) {
            try {
                setResend(true);
                await sendEmailVerification(auth.currentUser);
            } catch (error) {
            }
        }
    };

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === "active") {
                console.log("App has come to the foreground!");
                if (auth.currentUser) {
                    checkVerification(auth.currentUser);
                }
            }
            setAppState(nextAppState);
        });
        setResend(false);

        return () => {
            subscription.remove();
        };
    }, [appState]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                checkVerification(user);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <SafeAreaView className='flex-1 bg-dark-navy py-10 px-8' edges={["top"]}>
            <TouchableOpacity
                className="mb-4"
                onPress={() => {
                    signOutUser(false);
                    navigation.navigate("LoginScreen");
                }}
            >
                <Octicons name="chevron-left" size={30} color="white" />
            </TouchableOpacity>

            <View className='flex-col items-center mb-12 mx-6 h-[75%]'>
                <Text className='text-white text-center text-3xl'>Email Verification</Text>
                <Text className='text-white text-center text-lg mt-4'>Please check your email an email has been sent to <Text className='text-pale-orange'>{auth.currentUser?.email}</Text></Text>

            </View>
            {(!auth.currentUser?.emailVerified && !resend) && (
                <Pressable
                    onPress={resendVerificationEmail}
                >
                    <Text className="text-slate-400 text-xl"><Text className='text-white text-xl'>If you did not receive an email then click </Text>Resend Verification Email</Text>
                </Pressable>
            )}


        </SafeAreaView>
    );
};

export default GuestVerification;
