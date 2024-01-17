import { View, Text, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import React, { useEffect, useState, useContext, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import { Octicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/core";
import { UserContext } from "../../context/UserContext";
import { auth } from "../../config/firebaseConfig";
import { validateTamuEmail } from "../../helpers/validation";
import { signInWithCredential, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { initializeCurrentUserData } from "../../api/firebaseUtils";
import { AuthStackParams } from "../../types/Navigation";
import { Images } from "../../../assets";
import InteractButton from "../../components/InteractButton";

const LoginStudent = ({ navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo, signOutUser } = userContext!;

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        iosClientId: "600060629240-m7bu9ba9namtlmo9sii2s8qs2j9k5bt4.apps.googleusercontent.com",
        androidClientId: "600060629240-bdfsdcfmbrjh5skdc9qufchrmcnm26fb.apps.googleusercontent.com",
    });


    // Occurs when a user back swipe to this screen from the ProfileSetup screen
    useFocusEffect(
        useCallback(() => {
            signOutUser(false);
        }, [])
    );

    /**
     * Due to asynchronous problem, the value of completedAccountSetup may
     * initially be undefined. This function will check the value when userInfo
     * is changed until it's either true or false.
     */
    useEffect(() => {
        if (userInfo?.private?.privateInfo?.completedAccountSetup === false) {
            navigation.navigate("ProfileSetup");
        }
    }, [userInfo]);

    const handleUserAuth = () => {
        setLoading(true);
        initializeCurrentUserData()
            .then(async (userFromFirebase) => {
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
            .finally(async () => {
                setLoading(false);
            });
    };

    // Handle Google Sign-In
    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then((credential) => {
                    if (!validateTamuEmail(credential.user.email)) {
                        auth.signOut();
                        setError("Sign in with your tamu email");
                        return;
                    }
                    handleUserAuth();
                })
                .catch(error => {
                    console.error("Error during Google sign-in:", error);
                });
        }
    }, [response]);

    const googleSignIn = async () => {
        promptAsync();
    }

    return (
        <SafeAreaView className="flex-1 bg-dark-navy h-screen">
            <View className='pl-6 mt-2'>
                <TouchableOpacity
                    className="pr-4" onPress={() => navigation.navigate("LoginScreen")}
                    activeOpacity={1}
                >
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>
            </View>

            <View className="flex-col items-center my-8 pb-15">
                <Image
                    className="flex-row h-20 w-20 mb-3"
                    source={Images.SHPE_LOGO}
                />
            </View>
            <View className="items-center pb-40">
                <View className="flex-col w-4/5">
                    <Text className="text-white font-bold text-3xl">Student Login</Text>
                    <Text className="text-pale-orange text-lg">Sign in using tamu.edu email</Text>

                    <View className="flex-col mt-2">
                        <InteractButton
                            onPress={() => googleSignIn()}
                            label="Sign In with Google"
                            buttonClassName="bg-white mt-5 rounded-3xl py-1"
                            textClassName="text-[#3b3b3b] font-bold text-xl"
                            iconSource={{ uri: "https://developers.google.com/static/identity/images/g-logo.png" }}
                        />
                        {error && <Text style={{ color: 'red' }} className="text-center mt-2">{error}</Text>}
                        {loading && (
                            <ActivityIndicator className="mt-4" size={"large"} />
                        )}
                    </View>
                    <View className="items-center">
                    </View>
                </View>
            </View>

            <View className="flex-1 justify-end items-center">
                <View className="flex-row items-center">
                    <Text className="text-slate-400 text-lg">Don't have a student account?</Text>
                    <TouchableOpacity
                        className="items-center"
                        onPress={() => navigation.navigate("LoginGuest")}
                        activeOpacity={1}
                    >
                        <Text className="text-pale-orange text-lg ml-1">Guest Login</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </SafeAreaView>
    );
};

export default LoginStudent;
