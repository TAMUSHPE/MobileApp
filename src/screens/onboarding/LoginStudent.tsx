import { View, Text, Image, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
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
import { AuthStackParams } from "../../types/navigation";
import { Images } from "../../../assets";
import InteractButton from "../../components/InteractButton";
import { LinearGradient } from "expo-linear-gradient";

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
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >

            <SafeAreaView className="flex-1">
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="flex-1"
                >
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
                        <Text className="text-white text-center text-4xl font-bold">Student Login</Text>
                        <Text className="text-white text-center text-lg">Sign in with your Texas A&M email account to access
                            student-exclusive features.</Text>
                    </View>
                    {/* Action Button */}
                    <View className="mx-8 mt-20">
                        <InteractButton
                            onPress={() => googleSignIn()}
                            label="Sign In with Google"
                            buttonClassName="justify-center items-center bg-white rounded-xl h-14"
                            textClassName="text-black font-semibold text-2xl"
                            iconSource={{ uri: "https://developers.google.com/static/identity/images/g-logo.png" }}
                        />
                        <Text className="text-primary-orange text-lg text-center font-bold mt-2">Sign in using tamu.edu account</Text>
                        {error && <Text className="text-center mt-2 text-red-1 text-lg">{error}</Text>}
                        {loading && (
                            <ActivityIndicator className="mt-4" size="small" />
                        )}
                    </View>

                    {/* Footer */}
                    <View className="mx-8 flex-1 justify-end items-center">
                        <View className="flex-row items-center">
                            <Text className="text-grey-light text-lg">Don't have a student account?</Text>
                            <TouchableOpacity
                                className="items-center"
                                onPress={() => navigation.navigate("LoginGuest")}
                                activeOpacity={1}
                            >
                                <Text className="text-primary-orange text-lg ml-1">Guest Login</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default LoginStudent;
