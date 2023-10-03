import { View, Text, TextInput, KeyboardAvoidingView, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import React, { useEffect, useState, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import { auth } from "../config/firebaseConfig";
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { initializeCurrentUserData } from "../api/firebaseUtils";
import { UserContext } from "../context/UserContext";
import InteractButton from "../components/InteractButton";
import { AuthStackParams } from "../types/Navigation";
import { Images } from "../../assets";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        iosClientId: "600060629240-m7bu9ba9namtlmo9sii2s8qs2j9k5bt4.apps.googleusercontent.com",
        androidClientId: "600060629240-bdfsdcfmbrjh5skdc9qufchrmcnm26fb.apps.googleusercontent.com",
    });

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
            .then(userFromFirebase => {
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
        signInWithEmailAndPassword(auth, email, password)
            .then(handleUserAuth)
            .catch((error: Error) => {
                console.error("Error during email sign-in:", error);
                alert(error.message);
            })
    }

    // Handle Google Sign-In
    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then(handleUserAuth)
                .catch(error => {
                    console.error("Error during Google sign-in:", error);
                });
        }
    }, [response]);

    const googleSignIn = async () => {
        promptAsync();
    }

    return (
        <SafeAreaView className="flex-1 items-center justify-between bg-dark-navy">
            <View className="flex-col items-center my-8">
                <Image
                    className="flex-row h-20 w-20 mb-3"
                    source={Images.SHPE_LOGO}
                />
                <Text className="text-white text-center text-3xl">Welcome to SHPE</Text>
            </View>
            <View className="flex-col mt-2">
                <TouchableOpacity
                    onPress={() => navigation.navigate('LoginStudent')}
                    >
                    <Text className="text-white font-bold">Student</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('LoginGuest')}
                    >
                    <Text className="text-white font-bold">Guest</Text>
                </TouchableOpacity>
            </View>
            <View className="my-5 w-11/12">
                <Text className="text-right text-pale-orange mt-2">{"Society of Hispanic\nProfessional\nEngineers"}</Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
