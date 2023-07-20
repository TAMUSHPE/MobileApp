import { View, Text, TextInput, KeyboardAvoidingView, Image } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { auth } from "../config/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginStackNavigatorParamList } from "../types/Navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import InteractButton from "../components/InteractButton";
import { Images } from "../../assets";
import { initializeCurrentUserData } from "../api/firebaseUtils";
import { signInWithEmailAndPassword, signInAnonymously, UserCredential, onAuthStateChanged, updateProfile } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../context/UserContext";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<LoginStackNavigatorParamList>) => {
    // Hooks
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // User Context
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }
    const { userInfo, setUserInfo } = userContext;


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                // Store User Data
                await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                setUserInfo(authUser);

                // Navigation
                const currentUserData = await initializeCurrentUserData();
                if (currentUserData.private?.privateInfo?.completedAccountSetup) {
                    navigation.replace("HomeStack");
                }
                else {
                    navigation.replace("ProfileSetup");
                }
            }
        });

        return unsubscribe;
    }, [navigation]);

    const signIn = () => {
        signInWithEmailAndPassword(auth, email, password).catch(err => console.error(err));
    }

    const guestSignIn = () => {
        signInAnonymously(auth)
            .then((authUser: UserCredential) => {
                updateProfile(authUser.user, {
                    displayName: "Guest Account",
                    photoURL: "",
                });
                alert("Login as guest will be depricated in the future.");
                navigation.replace("HomeStack");
            })
            .catch((err) => console.error(err.message));
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
                        onSubmitEditing={() => signIn()}
                        textContentType="password"
                    />
                </KeyboardAvoidingView>
                <View className="flex-col mt-2">
                    <InteractButton
                        pressFunction={() => signIn()}
                        label="Sign In"
                        buttonStyle="bg-red mt-5 rounded-xl"
                        textStyle="text-white font-bold"
                    />
                    <View className="items-center my-4">
                        <Text className="text-white">Or</Text>
                    </View>
                    <InteractButton
                        pressFunction={() => navigation.navigate("RegisterScreen")}
                        label="Register Account"
                        buttonStyle="bg-[#ddd] rounded-xl"
                        textStyle="text-[#3b3b3b] font-bold"
                    />
                    <InteractButton
                        pressFunction={() => guestSignIn()}
                        label="Sign In As Guest"
                        buttonStyle="bg-[#ddd] mt-2 rounded-xl"
                        textStyle="text-[#3b3b3b] font-bold"
                    />
                    <InteractButton
                        pressFunction={() => alert("This feature is not implemented")}
                        label="Sign In with TAMU Google Account"
                        buttonStyle="bg-[#ddd] mt-2 rounded-xl"
                        textStyle="text-[#3b3b3b] font-bold"
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
