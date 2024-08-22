import { View, Text, KeyboardAvoidingView, Image, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import React, { useEffect, useState, useContext, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/core";
import { Octicons } from '@expo/vector-icons';
import { UserContext } from "../../context/UserContext";
import { auth } from "../../config/firebaseConfig";
import { initializeCurrentUserData } from "../../api/firebaseUtils";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AuthStackParams } from "../../types/navigation";
import { Images } from "../../../assets";
import TextInputWithFloatingTitle from "../../components/TextInputWithFloatingTitle";
import InteractButton from "../../components/InteractButton";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "@pietile-native-kit/keyboard-aware-scrollview";


const LoginGuest = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const { userInfo, setUserInfo, signOutUser } = useContext(UserContext)!;

    useFocusEffect(
        useCallback(() => {
            signOutUser(false);
        }, [])
    );

    useEffect(() => {
        if (userInfo && !auth.currentUser?.emailVerified) {
            navigation.navigate("GuestVerification");
        } else if (userInfo?.private?.privateInfo?.completedAccountSetup === false) {
            navigation.navigate("ProfileSetup");
        }

    }, [userInfo]);

    const handleUserAuth = () => {
        setLoading(true);
        initializeCurrentUserData()
            .then(async userFromFirebase => {
                const functions = getFunctions();
                const isUserInBlacklist = httpsCallable<{ uid: string }, { isInBlacklist: boolean }>(functions, 'isUserInBlacklist');

                try {
                    const checkBlackListResponse = await isUserInBlacklist({ uid: auth.currentUser?.uid! });

                    if (checkBlackListResponse.data.isInBlacklist) {
                        signOut(auth);
                        setError("You have been banned from the app");
                        return;
                    }
                } catch (error) {
                    console.error('Error during user authentication:', error);
                }

                AsyncStorage.setItem("@user", JSON.stringify(userFromFirebase))
                    .then(() => {
                        setUserInfo(userFromFirebase);
                    })
                    .catch(error => {
                        console.error("Error storing user in AsyncStorage:", error);
                    });
            })
            .catch(error => {
                console.error("Error during user authentication:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const emailSignIn = async () => {
        const trimmedEmail = email.trim();


        signInWithEmailAndPassword(auth, trimmedEmail, password)
            .then(handleUserAuth)
            .catch((error: Error) => {
                const errorCode = error.message.split('(')[1].split(')')[0]
                console.log(errorCode)
                switch (errorCode) {
                    case 'auth/invalid-email':
                        setError('The email address is invalid.')
                        break
                    case 'auth/user-not-found':
                        setError('No user found with this email address.')
                        break;
                    case 'auth/missing-password':
                        setError('Missing password')
                        break;
                    case 'auth/wrong-password':
                        setError('Wrong password. Please try again.')
                        break;
                    default:
                        setError('An unexpected error occurred. Please try again.')
                        break;
                }
            })
    }

    return (
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <SafeAreaView className="flex-1 h-screen">
                    <ScrollView>
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
                            <Text className="text-white text-center text-4xl font-bold">Guest Login</Text>
                        </View>


                        <View className="mx-8 mt-10">
                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => {
                                    setError("")
                                    setEmail(text)
                                }}
                                inputValue={email}
                                title='Email'
                                placeholderText='Email'
                                placeHolderColor="white"
                                titleStartY={20}
                                titleEndY={-5}
                                maxCharacters={64}
                                blurTitleClassName='text-xl'
                                focusTitleClassName='text-white text-xl ml-1'
                                textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                            />

                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => {
                                    setError("")
                                    setPassword(text)
                                }}
                                inputValue={password}
                                title='Password'
                                placeholderText='Password'
                                placeHolderColor="white"
                                titleStartY={20}
                                titleEndY={-5}
                                maxCharacters={64}
                                secureTextEntry
                                componentClassName="mt-4"
                                blurTitleClassName='text-xl'
                                focusTitleClassName='text-white text-xl ml-1'
                                textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                            />

                            <TouchableOpacity
                                className="pr-4" onPress={() => navigation.navigate("GuestRecoveryAccount")}
                                activeOpacity={1}
                            >
                                <Text className="text-grey-light text-lg mt-2">Forgot Your Password?</Text>
                            </TouchableOpacity>

                            <InteractButton
                                onPress={() => emailSignIn()}
                                label="Login"
                                buttonClassName="justify-center items-center bg-primary-orange mt-8 rounded-xl h-14"
                                textClassName="text-white font-semibold text-2xl"
                                underlayColor="#EF9260"
                            />
                            {error && <Text className="text-center mt-2 text-red-1 text-lg">{error}</Text>}
                            {loading && (
                                <ActivityIndicator className="mt-4" size="small" />
                            )}
                        </View>

                        <View className="mx-8 flex-1 justify-end items-center">
                            <View className="flex-row items-center">
                                <Text className="text-grey-light text-lg">Don't have a guest account?</Text>
                                <TouchableOpacity
                                    className="items-center"
                                    onPress={() => navigation.navigate("RegisterScreen")}
                                    activeOpacity={1}
                                >
                                    <Text className="text-primary-orange text-lg ml-1">Sign up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAwareScrollView>
        </LinearGradient>
    );
};

export default LoginGuest;
