import { View, Text, TextInput, KeyboardAvoidingView } from 'react-native';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, UserCredential, updateProfile } from "firebase/auth";
import { getUser, initializeCurrentUserData } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
import { evaluatePasswordStrength, validateEmail, validatePassword, validateTamuEmail } from '../helpers/validation';
import InteractButton from '../components/InteractButton';
import { AuthStackParams } from '../types/Navigation';
import { UserContext } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [displayName, setDisplayName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmationPassword, setConfirmationPassword] = useState<string>("");
    const [passwordStrengthColor, setPasswordStrengthColor] = useState<string>("text-[#f00]");
    const [passwordStrengthText, setPasswordStrengthText] = useState<string>("INVALID\n- Minimum 4 characters\n- Valid characters: : A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~");

    const inputStyle = "bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1";

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

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
        else if(validateTamuEmail(email)){
            alert("Guests must register with their personal email")
            return;
        } else if (!validatePassword(password)) {
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
            .then(async () => {
                // On Account Creation, save user to local
                // This is to deal with user that close app during profile setup
                const authUser = await getUser(auth.currentUser?.uid!)
                await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                setUserInfo(authUser); // Navigates to Home
            })
            .then(() => {
                navigation.navigate("ProfileSetup");
            })
            .catch((err) => { console.error(err.message); });
    }

    const handlePasswordStrengthIndicator = (text: string) => {
        const passwordStrength = evaluatePasswordStrength(text);
        const passwordStrengthValues = [
            {
                color: "text-[#f00]",
                text: "INVALID\n- Minimum 6 characters\n- Valid characters: : A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~"
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
                    <Text className='text-white'>Enter your email address:</Text>
                    <TextInput
                        placeholder="Email (eg. bob@gmail.com)"
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
                    onPress={() => registerUser()}
                    label="Register Account"
                    buttonClassName="justify-center items-center bg-continue-dark mt-5 rounded-xl"
                    textClassName="text-white font-bold"
                    underlayColor='#A22E2B'
                />
            </KeyboardAvoidingView>
            <View className="my-10 border-t-2 border-t-[#a8a8a8] w-11/12" />
        </SafeAreaView>
    );
};

export default RegisterScreen;
