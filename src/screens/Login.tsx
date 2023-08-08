import { View, Text, TextInput, KeyboardAvoidingView, Image } from "react-native";
import React, { useState, useContext } from "react";
import { auth } from "../config/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackNavigatorParamList } from "../types/Navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import InteractButton from "../components/InteractButton";
import { Images } from "../../assets";
import { initializeCurrentUserData } from "../api/firebaseUtils";
import { signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../context/UserContext";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<AuthStackNavigatorParamList>) => {
    // Hooks
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // User Context
    const userContext = useContext(UserContext);
    if (!userContext) {
        return null;
    }
    const { userInfo, setUserInfo } = userContext;


    const emailSignIn = async () => {
        signInWithEmailAndPassword(auth, email, password)
            .then(async () => {
                return await initializeCurrentUserData();
            })
            .then(async authUser => {
                await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                setUserInfo(authUser);

                if (!userInfo?.private?.privateInfo?.completedAccountSetup) {
                    navigation.replace("ProfileSetup")
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    const googleSignIn = async () => {
        alert("unimplemented");
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
                </KeyboardAvoidingView>
                <View className="flex-col mt-2">
                    <InteractButton
                        pressFunction={() => emailSignIn()}
                        label="Sign In"
                        buttonStyle="bg-continue-dark mt-5 rounded-xl"
                        textStyle="text-white font-bold"
                    />
                    <View className="items-center my-4">
                        <Text className="text-white">Or</Text>
                    </View>
                    <InteractButton
                        pressFunction={() => navigation.navigate("RegisterScreen")}
                        label="Register Account"
                        buttonStyle="bg-white rounded-xl"
                        textStyle="text-[#3b3b3b] font-bold"
                    />
                    <InteractButton
                        pressFunction={() => alert("This feature is not implemented")}
                        label="Sign In with Google"
                        buttonStyle="bg-white mt-2 rounded-xl"
                        textStyle="text-[#3b3b3b] font-bold"
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
