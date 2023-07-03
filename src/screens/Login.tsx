import { View, Button, Text, TouchableOpacity, TextInput, KeyboardAvoidingView } from "react-native";
import React, { useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackNavigatorParamList } from "../types/Navigation";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<MainStackNavigatorParamList>) => {
    // Hooks
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (authUser) {
                navigation.replace("Home");
            }
        });

        return unsubscribe;
    }, [navigation]);

    const signIn = () => {
        auth.signInWithEmailAndPassword(email, password).catch(error => alert(error));
    }

    const guestSignIn = () => {
        auth.signInAnonymously();
    }

    return (
        <SafeAreaView className="flex-1 items-center justify-between">
            <View>
                <Text>Registering as a new user is currently a WIP.</Text>
                <Text>Please select "Guest Log In"</Text>
            </View>
            <KeyboardAvoidingView className="flex-col w-4/5">
                <View className="flex-col my-2">
                    <TextInput
                        placeholder="Username/Email"
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1"
                        onChangeText={(text) => setEmail(text)}
                        autoFocus
                        value={email}
                        inputMode="email"
                    />
                    <TextInput
                        placeholder="Password"
                        className="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mt-2"
                        secureTextEntry
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        inputMode="text"
                    />
                </View>
                <View className="flex-col mt-2">
                    <TouchableOpacity
                        onPress={() => signIn()}
                        className="flex justify-center items-center p-2 rounded-md bg-[#52b1ff]"
                        activeOpacity={0.7}
                    >
                        <Text className="font-bold text-white">Log In</Text>
                    </TouchableOpacity>
                    <View className="items-center my-4">
                        <Text className="">Or</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Register")}
                        className="flex justify-center items-center p-2 rounded-md bg-[#ddd]"
                        activeOpacity={0.7}
                    >
                        <Text className="font-bold text-[#4b4b4b]">Register</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => guestSignIn()}
                        className="flex justify-center items-center mt-2 p-2 rounded-md bg-[#ddd]"
                        activeOpacity={0.7}
                    >
                        <Text className="font-bold text-[#4b4b4b]">Guest Log In</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <View className="my-5 border-t-2 border-t-[#a8a8a8] w-11/12">
                <Text className="text-center mt-2">This is the footer</Text>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
