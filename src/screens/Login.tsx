import { View, Text, TextInput, KeyboardAvoidingView, Image, ActivityIndicator } from "react-native";
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
    const { userInfo, setUserInfo } = userContext ?? {};
    if (!setUserInfo) {
        return null;
    }

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
        <SafeAreaView className="flex-1 items-center justify-between bg-primary-bg-dark">
            <View className="flex-col items-center my-8">
                <Image
                    className="flex-row h-20 w-20 mb-3"
                    source={Images.SHPE_LOGO}
                />
                <Text className="text-white text-center text-3xl">Welcome to SHPE</Text>
            </View>
            <View className="flex-col w-4/5">
                <KeyboardAvoidingView className="flex-col my-2">
                    <TextInput
                        placeholder="Email"
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1"
                        onChangeText={(text: string) => setEmail(text)}
                        value={email}
                        inputMode="email"
                        keyboardType="email-address"
                    />
                    <TextInput
                        placeholder="Password"
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mt-2"
                        secureTextEntry
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        inputMode="text"
                        onSubmitEditing={() => emailSignIn()}
                        textContentType="password"
                    />
                    {loading && (
                        <ActivityIndicator className="mt-4" size={"large"} />
                    )}
                </KeyboardAvoidingView>
                <View className="flex-col mt-2">
                    <InteractButton
                        onPress={() => emailSignIn()}
                        label="Sign In"
                        buttonClassName="bg-continue-dark mt-5 rounded-xl"
                        textClassName="text-white font-bold"
                    />
                    <View className="items-center my-4">
                        <Text className="text-white">Or</Text>
                    </View>
                    <InteractButton
                        onPress={() => navigation.navigate("RegisterScreen")}
                        label="Register Account"
                        buttonClassName="bg-white rounded-xl"
                        textClassName="text-[#3b3b3b] font-bold"
                    />
                    <InteractButton
                        onPress={() => googleSignIn()}
                        label="Sign In with Google"
                        buttonClassName="bg-white mt-2 rounded-xl"
                        textClassName="text-[#3b3b3b] font-bold"
                        iconURI="https://developers.google.com/static/identity/images/g-logo.png"
                    />
                </View>
            </View>
            <View className="my-5 w-11/12">
                <Text className="text-right text-pale-orange mt-2">{"Society of Hispanic\nProfessional\nEngineers"}</Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
