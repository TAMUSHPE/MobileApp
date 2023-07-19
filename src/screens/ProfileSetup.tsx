import { SafeAreaView, Text, View, KeyboardAvoidingView, Image, Animated } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../config/firebaseConfig';
import { getDownloadURL } from "firebase/storage";
import InteractButton from '../components/InteractButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackNavigatorParamList } from '../types/Navigation';
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';
import { uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectImage } from '../api/fileSelection';
import * as ImagePicker from "expo-image-picker";
import { Images } from '../../assets';
import { TouchableOpacity } from 'react-native-gesture-handler';

const safeAreaViewStyle = "flex-1 justify-between bg-dark-navy py-10 px-8"

const SetupNameAndBio = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    const [name, setName] = useState<string>("");
    const [bio, setBio] = useState<string>("");

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
                        textStyle='text-white text-lg font-bold'
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
    const [image, setImage] = useState<Blob | null>(null);
    const [localImageURI, setLocalImageURI] = useState<string>("");
    const [uploadState, setUploadState] = useState<string>("None");
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [downloadURL, setDownloadURL] = useState<string>("");
    const [arrowOpacity, setArrowOpacity] = useState<number>(0.8);
    const [continueButtonColor, setContinueButtonColor] = useState<string>("bg-gray-400");
    const [continueTextColor, setContinueTextColor] = useState<string>("text-gray-500");
    const [continueButtonActiveOpacity, setContinueButtonActiveOpacity] = useState<number>(1);
    const moveArrow = useRef(new Animated.Value(0)).current;

    const yVal = moveArrow.interpolate({
        inputRange: [0, 1],
        outputRange: [-10, 10]
    });

    Animated.loop(
        Animated.sequence([
            Animated.timing(moveArrow, {
                toValue: 1,
                duration: 1300,
                useNativeDriver: true,
            }),
            Animated.timing(moveArrow, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            })
        ])
    ).start();

    useEffect(() => {
        if(localImageURI === "" && arrowOpacity == 0){
            setArrowOpacity(0.8);
            setContinueButtonColor("bg-gray-400");
            setContinueTextColor("text-gray-500");
            setContinueButtonActiveOpacity(1);
        }
        else if(localImageURI !== "" && arrowOpacity != 0){
            setArrowOpacity(0);
            setContinueButtonColor("bg-red");
            setContinueTextColor("text-white");
            setContinueButtonActiveOpacity(0.7);
        }
    });

    const selectProfilePicture = async () => {
        const result = await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result) {
            const imageBlob = await getBlobFromURI(result.assets![0].uri);
            setLocalImageURI(result.assets![0].uri);
            setImage(imageBlob);
        }
    };

    const uploadProfilePicture = () => {
        if (image) {
            const uploadTask = uploadFileToFirebase(image, `profile-pictures/${auth.currentUser?.uid}/`);

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
    };

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View className='flex-col items-center'>
                <View className='flex-col items-center'>
                    <Text className='text-white text-center text-3xl'>Howdy!</Text>
                    <Text className='text-white text-center text-lg mt-4'>{"It's always nice to add a face to a name.\nWould you like to upload a photo?"}</Text>
                </View>
                <TouchableOpacity
                    className='w-64 h-64 my-8'
                    activeOpacity={0.6}
                    onPress={async () => await selectProfilePicture()}
                >
                    <Image
                        className="w-64 h-64 rounded-full"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={localImageURI !== "" ? { uri: localImageURI as string } : Images.DEFAULT_USER_PICTURE}
                    />
                    <Animated.View
                        className='absolute inset-x-1/4 inset-y-1/4 w-32 h-32'
                        style={{
                            transform: [{translateY: yVal}]
                        }}
                    >
                        <Image
                            className='w-full h-full'
                            style={{
                                opacity: arrowOpacity
                            }}
                            source={Images.UPLOAD_ARROW}
                        />
                    </Animated.View>
                </TouchableOpacity>
                <View className='flex-row w-10/12 justify-between mb-4'>
                    <InteractButton
                        pressFunction={() => navigation.goBack()}
                        label='Back'
                        buttonStyle='bg-[#ddd] rounded-md w-1/2'
                        textStyle='text-[#3b3b3b] text-lg font-bold'
                    />
                    <InteractButton
                        pressFunction={() => navigation.navigate("SetupProfilePicture")}
                        label='Continue'
                        buttonStyle={`${continueButtonColor ?? "bg-gray-500"} rounded-md w-1/2`}
                        textStyle={`${continueTextColor} text-lg font-bold`}
                        opacity={continueButtonActiveOpacity}
                    />
                </View>
                <InteractButton
                    pressFunction={() => navigation.navigate("SetupAcademicInformation")}
                    label='Skip For Now'
                    buttonStyle='bg-[#ddd] rounded-md w-10/12'
                    textStyle='text-[#3b3b3b] text-lg font-bold'
                />
            </View>
            <View></View>
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
