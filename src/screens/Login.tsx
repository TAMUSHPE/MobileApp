import { View, Button, Text, TouchableOpacity, TextInput, KeyboardAvoidingView } from "react-native";
import React, { useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainStackNavigatorParamList } from "../types/Navigation";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = ({ route, navigation }: NativeStackScreenProps<MainStackNavigatorParamList>) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if(authUser){
              navigation.replace("Home");
            }
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <SafeAreaView className="flex-1 items-center justify-center">
            <Text>This Screen currently has no functionality. Please proceed to the next screen by pressing "Login"</Text>
            <KeyboardAvoidingView className="w-100">
                <TextInput
                    placeholder="Username/Email"
                    onChangeText={(text) => setEmail(text)}
                    autoFocus
                    value={email}
                    inputMode="email"
                />
                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    inputMode="text"
                />
                <View className="mt-3">
                    <Button
                        title="Login"
                        onPress={() => navigation.replace("Home")}
                    />
                </View>
                <View className="mt-3">
                    <Button
                        title="Register"
                        onPress={() => navigation.navigate("Register")}
                    />
                </View>
                <View className="mt-3">
                    <Button
                        title="Login with google"
                        onPress={() => navigation.replace("Home")}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
