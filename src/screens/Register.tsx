import { View, Text, TextInput, KeyboardAvoidingView } from 'react-native';
import React, { useLayoutEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginStackNavigatorParamList } from '../types/Navigation';
import firebase from 'firebase/compat/app';
import { User } from '../types/User';
import InteractButton from '../components/InteractButton';

const RegisterScreen = ({ navigation }: NativeStackScreenProps<LoginStackNavigatorParamList>) => {
    // Hooks
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmationPassword, setConfirmationPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const inputStyle = "bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1";

    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: "Back to Login Screen"
        });
    }, [navigation]);

    const registerUser = () => {
        // TODO: Add checking of each value before user is created.
        if (password !== confirmationPassword) {
            alert();
            return;
        }

        const createdUser = new User({
            email: email,
            username: username,
            photoURL: "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg",
            firstName: firstName || "",
            lastName: lastName || "",
        });

        auth.createUserWithEmailAndPassword(email, password)
            .then((authUser: firebase.auth.UserCredential) => {
                authUser.user?.updateProfile(createdUser);
            })
            .catch((error) => alert(error.message));
    }

    return (
        <SafeAreaView className="flex-1 items-center justify-between">
            <KeyboardAvoidingView className="flex-col w-10/12">
                <View className='mt-2'>
                    <Text>Enter a unique username: <Text className='text-red-600'>*</Text></Text>
                    <TextInput
                        placeholder="Username"
                        className={inputStyle}
                        onChangeText={(text: string) => setUsername(text)}
                        autoFocus
                        value={username}
                        inputMode="text"
                        keyboardType="default"
                    />
                </View>
                <View className='mt-2'>
                    <Text>Enter your TAMU email address:<Text className='text-red-600'>*</Text></Text>
                    <TextInput
                        placeholder="Email (eg. bob@tamu.edu)"
                        className={inputStyle}
                        onChangeText={(text: string) => setEmail(text)}
                        value={email}
                        inputMode="email"
                        keyboardType="email-address"
                    />
                </View>
                <View className='mt-2'>
                    <Text>Enter your password:<Text className='text-red-600'>*</Text></Text>
                    <TextInput
                        placeholder="Password"
                        className={inputStyle}
                        onChangeText={(text: string) => setPassword(text)}
                        secureTextEntry
                        value={password}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                    />
                </View>
                <View className='mt-2'>
                    <Text>Re-enter your password:<Text className='text-red-600'>*</Text></Text>
                    <TextInput
                        placeholder="Confirm Password"
                        className={inputStyle}
                        onChangeText={(text: string) => setConfirmationPassword(text)}
                        secureTextEntry
                        value={confirmationPassword}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                    />
                </View>
                <View className='mt-2'>
                    <Text>Enter your first name:</Text>
                    <TextInput
                        placeholder="First Name"
                        className={inputStyle}
                        onChangeText={(text: string) => setFirstName(text)}
                        value={firstName}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                    />
                </View>
                <View className='mt-2'>
                    <Text>Enter your last name:</Text>
                    <TextInput
                        placeholder="Last Name"
                        className={inputStyle}
                        onChangeText={(text: string) => setLastName(text)}
                        value={lastName}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                        onSubmitEditing={() => registerUser()}
                    />
                </View>
                <InteractButton
                    pressFunction={() => registerUser()}
                    label="Register Account"
                    buttonStyle="bg-blue-500 mt-5 rounded-md"
                    textStyle="text-white font-bold"
                />
            </KeyboardAvoidingView>
            <View className="my-5 border-t-2 border-t-[#a8a8a8] w-11/12">
                <Text className="text-center mt-2"><Text className='text-red-600'>*</Text> - required</Text>
            </View>
        </SafeAreaView>
    );
};

export default RegisterScreen;