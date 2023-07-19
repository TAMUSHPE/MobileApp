import { View, Text, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginStackNavigatorParamList } from '../types/Navigation';
import React, { useLayoutEffect, useState } from 'react';
import { createUserWithEmailAndPassword, UserCredential, updateProfile } from "firebase/auth";
import { evaluatePasswordStrength, validateEmail, validatePassword } from '../helpers/validation';
import { initializeCurrentUserData } from '../api/firebaseUtils';
import InteractButton from '../components/InteractButton';

const RegisterScreen = ({ navigation }: NativeStackScreenProps<LoginStackNavigatorParamList>) => {
    // Hooks
    const [displayName, setDisplayName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmationPassword, setConfirmationPassword] = useState<string>("");
    const [passwordStrengthColor, setPasswordStrengthColor] = useState<string>("text-[#f00]");
    const [passwordStrengthText, setPasswordStrengthText] = useState<string>("INVALID\n- Minimum 4 characters\n- Valid characters: : A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~");

    const inputStyle = "bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1";

    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: "Back to Login Screen"
        });
    }, [navigation]);

    const registerUser = () => {
        if (password !== confirmationPassword) {
            alert("Original password and re-entered password do not match!");
            return;
        }
        else if (!validateEmail(email)) {
            alert("Invalid Email.")
            return;
        }
        else if (!validatePassword(password)) {
            alert("Password must meet specifications:\n- 4-64 characters\n- Spaces are allowed\n- Valid characters: A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~")
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (authUser: UserCredential) => {
                await updateProfile(authUser.user, {
                    displayName: displayName,
                    photoURL: ""
                });

                await initializeCurrentUserData();
            })
            .catch((err) => { console.error(err.message); });
    }

    const handlePasswordStrengthIndicator = (text: string) => {
        const passwordStrength = evaluatePasswordStrength(text);
        const passwordStrengthValues = [
            {
                color: "text-[#f00]",
                text: "INVALID\n- Minimum 4 characters\n- Valid characters: : A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~"
            },
            {
                color: "text-[#f90]",
                text: "Weak"
            },
            {
                color: "text-[#ff0]",
                text: "Average"
            },
            {
                color: "text-[#0f0]",
                text: "Strong"
            },
        ]

        setPasswordStrengthText(passwordStrengthValues[passwordStrength]["text"]);
        setPasswordStrengthColor(passwordStrengthValues[passwordStrength]["color"]);
    }

    return (
        <SafeAreaView className="flex-1 items-center justify-between bg-dark-navy">
            <KeyboardAvoidingView className="flex-col w-10/12">
                <View className='mt-2'>
                    <Text className='text-white'>Enter a unique username:</Text>
                    <TextInput
                        placeholder="Display Name"
                        className={inputStyle}
                        onChangeText={(text: string) => setDisplayName(text)}
                        autoFocus
                        value={displayName}
                        inputMode="text"
                        keyboardType="default"
                    />
                </View>
                <View className='mt-2'>
                    <Text className='text-white'>Enter your TAMU email address:</Text>
                    <TextInput
                        placeholder="Email (eg. bob@tamu.edu)"
                        className={inputStyle}
                        onChangeText={(text: string) => setEmail(text)}
                        value={email}
                        inputMode="email"
                        keyboardType="email-address"
                    />
                </View>
                <View className='mt-2'>
                    <Text className='text-white'>Enter your password:</Text>
                    <TextInput
                        placeholder="Password"
                        className={inputStyle}
                        onChangeText={(text: string) => {
                            setPassword(text);
                            handlePasswordStrengthIndicator(text);
                        }}
                        secureTextEntry
                        value={password}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                    />
                    <View className='bg-dark-navy'>
                        <Text className='text-white'>Password Strength: <Text className={passwordStrengthColor}>{passwordStrengthText}</Text></Text>
                    </View>
                </View>
                <View className='mt-2'>
                    <Text className='text-white'>Re-enter your password:</Text>
                    <TextInput
                        placeholder="Confirm Password"
                        className={inputStyle}
                        onChangeText={(text: string) => setConfirmationPassword(text)}
                        secureTextEntry
                        value={confirmationPassword}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                    />
                </View>
                <InteractButton
                    pressFunction={() => registerUser()}
                    label="Register Account"
                    buttonStyle="bg-red mt-5 rounded-xl"
                    textStyle="text-white font-bold"
                />
            </KeyboardAvoidingView>
            <View className="my-10 border-t-2 border-t-[#a8a8a8] w-11/12" />
        </SafeAreaView>
    );
};

export default RegisterScreen;
