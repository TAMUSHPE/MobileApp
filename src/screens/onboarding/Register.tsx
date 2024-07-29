import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
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
import { createUserWithEmailAndPassword, UserCredential, updateProfile, sendEmailVerification } from "firebase/auth";
import { evaluatePasswordStrength, validateUsername, validateEmail, validatePassword, validateTamuEmail } from '../../helpers/validation';
import { AuthStackParams } from '../../types/navigation';
import { Images } from "../../../assets";
import InteractButton from '../../components/InteractButton';
import TextInputWithFloatingTitle from '../../components/TextInputWithFloatingTitle';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

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
    const [error, setError] = useState<string>("");

    const { setUserInfo, signOutUser } = useContext(UserContext)!;

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
        const trimmedEmail = email.trim();

        if (password !== confirmationPassword) {
            setError("Password Mismatch. Original password and re-entered password do not match!");
            return;
        }
        else if (!validateEmail(trimmedEmail)) {
            setError("Invalid Email.")
            return;
        }
        else if (validateTamuEmail(trimmedEmail)) {
            setError("Guests must register with their personal email")
            return;
        } else if (!validatePassword(password)) {
            setError("Password must meet specifications:\n- 4-64 characters\n- Spaces are allowed\n- Valid characters: A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~")
            return;
        } else if (!validateUsername(displayName)) {
            setError("Usernames must only contain letters, numbers, underscores, or hyphens.")
            return;
        }
        setLoading(true);

        createUserWithEmailAndPassword(auth, trimmedEmail, password)
            .then(async (authUser: UserCredential) => {
                await sendEmailVerification(authUser.user)
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
                navigation.navigate("GuestVerification");
            })
            .catch((error) => {
                const errorCode = error.message.split('(')[1].split(')')[0]
                console.log(errorCode)
                switch (errorCode) {
                    case 'auth/email-already-in-use':
                        setError('The email is already in use.')
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.')
                        break;
                }
            })
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
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <SafeAreaView className="flex-1 h-screen">
                    {/* Header */}
                    <View className='px-4 mt-5'>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("LoginGuest")}
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
                        <Text className="text-white text-center text-4xl font-bold">Create Guest Account</Text>
                    </View>



                    <View className="mx-8 mt-10">
                        <TextInputWithFloatingTitle
                            setTextFunction={(text: string) => {
                                setError("")
                                setDisplayName(text)
                            }}
                            inputValue={displayName}
                            title='Username'
                            placeholderText='Username'
                            titleStartY={20}
                            titleEndY={0}
                            maxCharacters={64}
                            blurTitleClassName='text-xl'
                            focusTitleClassName='text-white text-xl ml-1'
                            textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                        />
                        {(!isUnique && displayName != "") && <Text className='text-red-1 text-lg'>Username is already taken!</Text>}
                        {!validUsername && <Text className='text-red-1 text-lg'>Username must only contain letters, numbers, underscores, or hyphens.</Text>}

                        <TextInputWithFloatingTitle
                            setTextFunction={(text: string) => {
                                setError("")
                                setEmail(text)
                            }}
                            inputValue={email}
                            title='Email'
                            placeholderText='Email (eg. bob@gmail.com)'
                            titleStartY={20}
                            titleEndY={0}
                            maxCharacters={64}
                            componentClassName='mt-4'
                            blurTitleClassName='text-xl'
                            focusTitleClassName='text-white text-xl ml-1'
                            textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                        />

                        <TextInputWithFloatingTitle
                            setTextFunction={(text: string) => {
                                setError("")
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
                            componentClassName='mt-4'
                            blurTitleClassName='text-xl'
                            focusTitleClassName='text-white text-xl ml-1'
                            textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                        />
                        {password != "" && (
                            <View className=''>
                                <Text className='text-white text-lg'>Password Strength: <Text className={passwordStrengthColor}>{passwordStrengthText}</Text></Text>
                            </View>
                        )}

                        <TextInputWithFloatingTitle
                            setTextFunction={(text) => {
                                setError("")
                                setConfirmationPassword(text)
                            }}
                            inputValue={confirmationPassword}
                            title='Confirm Password'
                            placeholderText='Confirm Password'
                            titleStartY={20}
                            titleEndY={0}
                            maxCharacters={64}
                            secureTextEntry
                            componentClassName='mt-4'
                            blurTitleClassName='text-xl'
                            focusTitleClassName='text-white text-xl ml-1'
                            textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                        />


                        <InteractButton
                            onPress={() => registerUser()}
                            label="Register"
                            buttonClassName="justify-center items-center bg-primary-orange mt-8 rounded-xl h-14"
                            textClassName="text-white font-semibold text-2xl"
                            underlayColor="#EF9260"
                        />

                        {error && <Text className="text-center mt-2 text-red-1 text-lg">{error}</Text>}
                        {loading && (
                            <ActivityIndicator className="mt-4" size="small" />
                        )}
                    </View>

                </SafeAreaView>
                <View className='pb-20' />
            </KeyboardAwareScrollView>
        </LinearGradient>
    );
};

export default RegisterScreen;
