import { View, Text, Alert, TouchableOpacity, Image, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/core';
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getUser, initializeCurrentUserData } from '../../api/firebaseUtils';
import { isUsernameUnique } from '../../api/firebaseUtils';
import { createUserWithEmailAndPassword, UserCredential, updateProfile } from "firebase/auth";
import { evaluatePasswordStrength, validateUsername, validateEmail, validatePassword, validateTamuEmail } from '../../helpers/validation';
import { AuthStackParams } from '../../types/Navigation';
import { Images } from "../../../assets";
import InteractButton from '../../components/InteractButton';
import TextInputWithFloatingTitle from '../../components/TextInputWithFloatingTitle';

const RegisterScreen = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [displayName, setDisplayName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmationPassword, setConfirmationPassword] = useState<string>("");
    const [passwordStrengthColor, setPasswordStrengthColor] = useState<string>("text-[#f00]");
    const [passwordStrengthText, setPasswordStrengthText] = useState<string>();
    const [isUnique, setIsUnique] = useState(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [validUsername, setValidUsername] = useState<boolean>(true);

    const userContext = useContext(UserContext);
    const { setUserInfo, signOutUser } = userContext!;

    // Occurs when a user back swipe to this screen from the ProfileSetup screen
    useFocusEffect(
        useCallback(() => {
            signOutUser(false);
            return () => { };
        }, [])
    );

    useEffect(() => {
        if (displayName != "") {
            isUsernameUnique(displayName).then(setIsUnique);
            setValidUsername(validateUsername(displayName));
        }
    }, [displayName]);


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
        } else if (!validateUsername(displayName)) {
            alert("Usernames must only contain letters, numbers, underscores, or hyphens.")
            return;
        }
        setLoading(true);

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
                const firebaseUser = await getUser(auth.currentUser?.uid!)
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                setUserInfo(firebaseUser); // Navigates to Home
            })
            .then(() => {
                navigation.navigate("ProfileSetup");
            })
            .catch((err) => { console.error(err.message); })
            .finally(() => {
                setLoading(false);
            });
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView>
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
                            <View className="flex-col my-2">
                                <View>
                                    <TextInputWithFloatingTitle
                                        setTextFunction={(text: string) => setDisplayName(text)}
                                        inputValue={displayName}
                                        title='Username'
                                        placeholderText='Username'
                                        titleStartY={20}
                                        titleEndY={0}
                                        maxCharacters={64}
                                        blurTitleClassName='text-white text-md'
                                        focusTitleClassName='text-gray-300 text-sm ml-1'
                                        textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2"
                                    />
                                    {(!isUnique && displayName != "") && <Text style={{ color: 'red' }}>Username is already taken!</Text>}
                                    {!validUsername && <Text style={{ color: 'red' }}>Username must only contain letters, numbers, underscores, or hyphens.</Text>}
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
                                        secureTextEntry
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
                                        secureTextEntry
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
                                    {loading && (
                                        <ActivityIndicator className="mt-4" size={"large"} />
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;
