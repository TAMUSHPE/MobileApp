import { SafeAreaView, Text, View, KeyboardAvoidingView } from 'react-native';
import React, { useState } from 'react';
import { db, auth, storage } from '../config/firebaseConfig';
import { getDownloadURL } from "firebase/storage";
import InteractButton from '../components/InteractButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackNavigatorParamList } from '../types/Navigation';
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';
import { uploadFileToFirebase } from '../api/firebaseUtils';

const safeAreaViewStyle = "flex-1 justify-between bg-dark-navy py-10 px-8"

const SetupNameAndBio = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    const [name, setName] = useState<string>();
    const [bio, setBio] = useState<string>();

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View>
                <View className='flex-col items-center mb-20'>
                    <Text className='text-white text-center text-3xl'>Tell Us About Yourself</Text>
                    <Text className='text-white text-center text-lg mt-4'>Please enter your full name{"\n"} below to get started.</Text>
                </View>
                <KeyboardAvoidingView className="flex-col">
                    <TextInputWithFloatingTitle
                        setTextFunction={(text: string) => {
                            if (text.length <= 64)
                                setName(text);
                        }}
                        inputValue={name}
                        title='Name*'
                        placeholderText='Name*'
                        titleStartY={20}
                        titleEndY={0}
                        maxCharacters={64}
                        blurTextStyle='text-white text-md'
                        focusTextStyle='text-white text-md'
                        textInputStyle="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mb-3"
                    />
                    <TextInputWithFloatingTitle
                        setTextFunction={(text: string) => {
                            if (text.length <= 250)
                                setBio(text)
                        }}
                        inputValue={bio}
                        title='Write a short bio...'
                        titleStartY={20}
                        titleEndY={0}
                        placeholderText='Write a short bio...'
                        maxCharacters={250}
                        blurTextStyle='text-white text-md'
                        focusTextStyle='text-white text-md'
                        lineCount={5}
                        isMultiline
                        textInputStyle="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mb-3"
                    />
                    <InteractButton
                        pressFunction={() => navigation.navigate("SetupProfilePicture")}
                        label='Continue'
                        buttonStyle='bg-red rounded-md'
                        textStyle='text-white font-bold'
                    />
                </KeyboardAvoidingView>
            </View>
            <View>
                <Text className='text-white'>* Items with an asterisk are required</Text>
            </View>
        </SafeAreaView>
    );
};

const SetupProfilePicture = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    const [image, setImage] = useState<Blob>();
    const [uploadState, setUploadState] = useState<string>("None");
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [downloadURL, setDownloadURL] = useState<string>("");

    const uploadProfilePicture = () => {
        if (image) {
            const uploadTask = uploadFileToFirebase(image, `profile-pictures/${auth.currentUser?.uid}`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress)
                    setUploadState(snapshot.state);
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    switch (error.code) {
                        case "storage/unauthorized":
                            alert("File could not be upload due to user permissions");
                            break;
                        case "storage/canceled":
                            alert("File upload cancelled");
                            break;
                        default:
                            alert("An unknown error has occured")
                            break;
                    }
                },
                async () => {
                    await getDownloadURL(uploadTask.snapshot.ref).then((URL) => {
                        setDownloadURL(URL);
                        console.log("File available at", URL);
                    });
                });
        }
    }
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

const SetupAcademicInformation = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

const SetupCommittees = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    return (
        <SafeAreaView className={safeAreaViewStyle}>

        </SafeAreaView>
    );
};

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees };
