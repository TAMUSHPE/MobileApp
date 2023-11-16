import { View, Text, TextInput, KeyboardAvoidingView, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import React, { useEffect, useState, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../config/firebaseConfig";
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { initializeCurrentUserData } from "../api/firebaseUtils";
import { UserContext } from "../context/UserContext";
import InteractButton from "../components/InteractButton";
import { AuthStackParams } from "../types/Navigation";
import { Images } from "../../assets";
import { Octicons } from '@expo/vector-icons';


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
        <SafeAreaView className="flex-1 bg-dark-navy">
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
                    <Text className="text-white font-bold text-3xl mb-3">Guest Login</Text>
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
                            className="bg-[#e4e4e4] border-2 border-gray-300 rounded-lg pr-10 pl-1 py-2 mt-4"
                            secureTextEntry
                            onChangeText={(text) => setPassword(text)}
                            value={password}
                            inputMode="text"
                            onSubmitEditing={() => emailSignIn()}
                            textContentType="password"
                        />
                    </KeyboardAvoidingView>
                    <View className="flex-col">
                        <TouchableOpacity
                            className="pr-4" onPress={() => alert("To be implemented")}
                            activeOpacity={1}
                        >
                            <Text className="text-slate-400 text-xl">Forgot Your Password?</Text>
                        </TouchableOpacity>
                        <InteractButton
                            onPress={() => emailSignIn()}
                            label="Login"
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
            <View className="flex-1 justify-end items-center">
                <View className="flex-row items-center">
                    <Text className="text-slate-400 text-lg">Don't have an account?</Text>
                    <TouchableOpacity
                        className="items-center"
                        onPress={() => navigation.navigate("RegisterScreen")}
                        activeOpacity={1}
                    >
                        <Text className="text-pale-orange text-lg ml-1">Sign up</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </SafeAreaView>
    );
};

export default LoginGuest;
