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

const LoginGuest = ({ route, navigation }: NativeStackScreenProps<AuthStackParams>) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;
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


    return (
        <SafeAreaView className="flex-1 items-center justify-between bg-dark-navy">
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
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2"
                        onChangeText={(text: string) => setEmail(text)}
                        value={email}
                        inputMode="email"
                        keyboardType="email-address"
                    />
                    <TextInput
                        placeholder="Password"
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 mt-2 py-2"
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
                        buttonClassName="justify-center items-center bg-continue-dark mt-5 rounded-xl"
                        textClassName="text-white font-bold"
                        underlayColor="#A22E2B"
                    />
                    <View className="items-center my-4">
                        <Text className="text-white">Or</Text>
                    </View>
                    <InteractButton
                        onPress={() => navigation.navigate("RegisterScreen")}
                        label="Register Account"
                        buttonClassName="justify-center items-center bg-white rounded-xl"
                        textClassName="text-[#3b3b3b] font-bold"
                    />
                </View>
            </View>
            <View className="my-5 w-11/12">
                <Text className="text-right text-pale-orange mt-2">{"Society of Hispanic\nProfessional\nEngineers"}</Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginGuest;
