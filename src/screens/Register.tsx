import { View, Text, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginStackNavigatorParamList } from '../types/Navigation';
import { User } from '../types/User';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import InteractButton from '../components/InteractButton';
import { evaluatePasswordStrength, validateEmail, validatePassword } from '../helpers/validation';

const RegisterScreen = ({ navigation }: NativeStackScreenProps<LoginStackNavigatorParamList>) => {
    // Hooks
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmationPassword, setConfirmationPassword] = useState<string>("");
    const [passwordStrengthColor, setPasswordStrengthColor] = useState<string>("text-red");
    const [passwordStrengthText, setPasswordStrengthText] = useState<string>("INVALID");

    const inputStyle = "bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1";

    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: "Back to Login Screen"
        });
    }, [navigation]);

    const registerUser = () => {
        // TODO: Add checking of each value before user is created.
        if (password !== confirmationPassword) {
            alert("Original password and re-entered password do not match!");
            return;
        }
        else if (!validateEmail(email)) {
            alert("Invalid Email.")
            return;
        }
        else if (!validatePassword(password)) {
            alert("Password must meet specifications:\n- 4-64 characters\n- Spaces are allowed\n- Valid characters: A-Z, 0-9, !\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~")
            return;
        }

        const createdUser = new User({
            email: email,
            username: username,
            photoURL: "",
            firstName: "",
            lastName: "",
        });

        auth.createUserWithEmailAndPassword(email, password)
            .then((authUser: firebase.auth.UserCredential) => {
                authUser.user?.updateProfile(createdUser);
            })
            .catch((error) => alert(error.message));
    }

    const handlePasswordStrengthIndicator = (text: string) => {
        const passwordStrength = evaluatePasswordStrength(text);
        const passwordStrengthValues = [
            {
                color: "text-[#f00]",
                text: "INVALID"
            },
            {
                color: "text-[#f90]",
                text: "Weak"
            },
            {
                color: "text-[#ff0]",
                text: "Average"
            },
            {
                color: "text-[#0f0]",
                text: "Strong"
            },
        ]

        setPasswordStrengthText(passwordStrengthValues[passwordStrength]["text"]);
        setPasswordStrengthColor(passwordStrengthValues[passwordStrength]["color"]);
    }

    return (
        <SafeAreaView className="flex-1 items-center justify-between bg-slate-500">
            <KeyboardAvoidingView className="flex-col w-10/12">
                <View className='mt-2'>
                    <Text>Enter a unique username:</Text>
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
                    <Text>Enter your TAMU email address:</Text>
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
                    <Text>Enter your password:</Text>
                    <TextInput
                        placeholder="Password"
                        className={inputStyle}
                        onChangeText={(text: string) => {
                            setPassword(text);
                            handlePasswordStrengthIndicator(text);
                        }}
                        secureTextEntry
                        value={password}
                        inputMode="text"
                        autoCorrect={false}
                        textContentType="password"
                    />
                    <View className=''>
                        <Text>Password Strength: <Text className={passwordStrengthColor}>{passwordStrengthText}</Text></Text>
                    </View>
                </View>
                <View className='mt-2'>
                    <Text>Re-enter your password:</Text>
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
                <InteractButton
                    pressFunction={() => registerUser()}
                    label="Register Account"
                    buttonStyle="bg-red mt-5 rounded-xl"
                    textStyle="text-white font-bold"
                />
            </KeyboardAvoidingView>
            <View className="my-10 border-t-2 border-t-[#a8a8a8] w-11/12" />
        </SafeAreaView>
    );
};

export default RegisterScreen;
