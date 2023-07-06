import { View, Button, Text, TouchableOpacity, TextInput, KeyboardAvoidingView } from "react-native";
import React, { useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginStackNavigatorParamList } from "../types/Navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import InteractButton from "../components/InteractButton";
import firebase from 'firebase/compat/app';
import { User } from '../types/User';

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<LoginStackNavigatorParamList>) => {
    // Hooks
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
                navigation.replace("HomeStack");
            }
        });

        return unsubscribe;
    }, [navigation]);

    const signIn = () => {
        auth.signInWithEmailAndPassword(email, password).catch(error => alert(error));
    }

    const guestSignIn = () => {
        const tempUser = new User({
            email: "",
            username: "Guest Account",
            photoURL: "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg",
            firstName:  "Guest",
            lastName: "Account",
        });

        auth.signInAnonymously()
            .then((authUser: firebase.auth.UserCredential) => {
                authUser.user?.updateProfile(tempUser);
            })
            .catch((error) => alert(error.message));;
    }

    return (
        <SafeAreaView className="flex-1 items-center justify-between">
            <View>
                <Text>Registering as a new user is currently a WIP.</Text>
                <Text>Please select "Guest Log In"</Text>
            </View>
            <View className="flex-col w-4/5">
                <KeyboardAvoidingView className="flex-col my-2">
                    <TextInput
                        placeholder="Email"
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1"
                        onChangeText={(text: string) => setEmail(text)}
                        autoFocus
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
                        buttonStyle="bg-blue-500 mt-5 rounded-md"
                        textStyle="text-white font-bold"
                    />
                    <View className="items-center my-4">
                        <Text>Or</Text>
                    </View>
                    <InteractButton
                        pressFunction={() => navigation.navigate("Register")}
                        label="Register Account"
                        buttonStyle="bg-[#ddd] rounded-md"
                        textStyle="text-[#3b3b3b] font-bold"
                    />
                    <InteractButton
                        pressFunction={() => guestSignIn()}
                        label="Sign In As Guest"
                        buttonStyle="bg-[#ddd] mt-2 rounded-md"
                        textStyle="text-[#3b3b3b] font-bold"
                    />
                </View>
            </View>
            <View className="my-5 border-t-2 border-t-[#a8a8a8] w-11/12">
                <Text className="text-center mt-2">This is the footer</Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
