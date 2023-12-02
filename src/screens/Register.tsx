import { View, Text, TextInput, KeyboardAvoidingView, Alert, TouchableOpacity, Image } from 'react-native';
import React, { useCallback, useContext, useLayoutEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, UserCredential, updateProfile, signOut } from "firebase/auth";
import { getUser, initializeCurrentUserData } from '../api/firebaseUtils';
import { auth } from '../config/firebaseConfig';
import { evaluatePasswordStrength, validateEmail, validatePassword, validateTamuEmail } from '../helpers/validation';
import InteractButton from '../components/InteractButton';
import { AuthStackParams } from '../types/Navigation';
import { UserContext } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/core';
import { Octicons } from '@expo/vector-icons';
import { Images } from "../../assets";
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';

const RegisterScreen = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [displayName, setDisplayName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmationPassword, setConfirmationPassword] = useState<string>("");
    const [passwordStrengthColor, setPasswordStrengthColor] = useState<string>("text-[#f00]");
    const [passwordStrengthText, setPasswordStrengthText] = useState<string>();

    const inputStyle = "bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1";

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const signOutUser = async () => {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem('@user');
            setUserInfo(undefined);
        } catch (error) {
            console.error(error);
        }
    };

    // Occurs when a user back swipe to this screen from the ProfileSetup screen
    useFocusEffect(
        useCallback(() => {
            signOutUser();
            return () => { };
        }, [])
    );

    const registerUser = () => {
        if (password !== confirmationPassword) {
            Alert.alert("Password Mismatch", "Original password and re-entered password do not match!");
            return;
        }
        else if (!validateEmail(email)) {
            alert("Invalid Email.")
            return;
        }
        else if (validateTamuEmail(email)) {
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
        <SafeAreaView className="flex-1 bg-dark-navy">
            <View className='pl-6 mt-2'>
                <TouchableOpacity
                    className="pr-4" onPress={() => navigation.navigate("LoginScreen")}
                    activeOpacity={1}
                >
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>
            </View>

            <View className="flex-col items-center my-8 mb-11">
                <Image
                    className="flex-row h-20 w-20 mb-3"
                    source={Images.SHPE_LOGO}
                />
            </View>
            <View className="flex items-center">
                <View className="flex-col w-[80%]">
                    <Text className="text-white font-bold text-3xl mb-3">Create Guest Account</Text>
                    <KeyboardAvoidingView className="flex-col my-2">
                        <View>
                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => setDisplayName(text)}
                                inputValue={displayName}
                                title='Name'
                                placeholderText='Name'
                                titleStartY={20}
                                titleEndY={0}
                                maxCharacters={64}
                                blurTitleClassName='text-white text-md'
                                focusTitleClassName='text-gray-300 text-sm ml-1'
                                textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2"
                            />
                        </View>

                        <View className='mt-4'>
                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => setEmail(text)}
                                inputValue={email}
                                title='Email'
                                placeholderText='Email (eg. bob@gmail.com)'
                                titleStartY={20}
                                titleEndY={0}
                                maxCharacters={64}
                                blurTitleClassName='text-white text-md'
                                focusTitleClassName='text-gray-300 text-sm ml-1'
                                textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2"
                            />
                        </View>

                        <View className='mt-4'>
                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => {
                                    setPassword(text);
                                    handlePasswordStrengthIndicator(text);
                                }}
                                inputValue={password}
                                title='Password'
                                placeholderText='Password'
                                titleStartY={20}
                                titleEndY={0}
                                maxCharacters={64}
                                blurTitleClassName='text-white text-md'
                                focusTitleClassName='text-gray-300 text-sm ml-1'
                                textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2"
                            />
                        </View>

                        {password != "" && (
                            <View className='bg-dark-navy'>
                                <Text className='text-white'>Password Strength: <Text className={passwordStrengthColor}>{passwordStrengthText}</Text></Text>
                            </View>
                        )}

                        <View className='mt-4'>
                            <TextInputWithFloatingTitle
                                setTextFunction={(text) => setConfirmationPassword(text)}
                                inputValue={confirmationPassword}
                                title='Confirm Password'
                                placeholderText='Confirm Password'
                                titleStartY={20}
                                titleEndY={0}
                                maxCharacters={64}
                                blurTitleClassName='text-white text-md'
                                focusTitleClassName='text-gray-300 text-sm ml-1'
                                textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2"
                            />
                        </View>
                        <View className="flex-col">
                            <InteractButton
                                onPress={() => registerUser()}
                                label="Register"
                                buttonClassName="justify-center items-center bg-continue-dark mt-5 rounded-xl py-2"
                                textClassName="text-white font-bold text-xl"
                                underlayColor="#A22E2B"
                            />
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default RegisterScreen;
