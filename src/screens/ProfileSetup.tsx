import { SafeAreaView, Text, View, KeyboardAvoidingView, Image, Animated } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../config/firebaseConfig';
import { getDownloadURL } from "firebase/storage";
import InteractButton from '../components/InteractButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackNavigatorParamList } from '../types/Navigation';
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';
import { setPrivateUserData, setPublicUserData, uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectImage } from '../api/fileSelection';
import * as ImagePicker from "expo-image-picker";
import { Images } from '../../assets';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { updateProfile } from 'firebase/auth';

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
                        pressFunction={async () => {
                            if (name !== "") {
                                if (auth.currentUser) {
                                    await setPublicUserData({
                                        name: name,
                                        bio: bio,
                                    });
                                }
                                navigation.navigate("SetupProfilePicture")
                            }
                        }}
                        label='Continue'
                        buttonStyle={`${name === "" ? "bg-gray-500" : "bg-red"} rounded-md`}
                        textStyle={`${name === "" ? "text-gray-700" : "text-white"} text-lg font-bold`}
                        opacity={name === "" ? 1 : 0.8}
                    />
                </KeyboardAvoidingView>
            </View>
            <View>
                <Text className='text-white'>{"* Items with an asterisk are required\nThese can be changed later"}</Text>
            </View>
        </SafeAreaView>
    );
};

/**
 * SetupProfilePicture is a screen where the user chooses a profile picture for their account.
 */
const SetupProfilePicture = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    const [image, setImage] = useState<Blob | null>(null);
    const [imageName, setImageName] = useState<string | null | undefined>();
    const [localImageURI, setLocalImageURI] = useState<string>("");
    const moveArrow = useRef(new Animated.Value(0)).current;

    const arrowYVal = moveArrow.interpolate({
        inputRange: [0, 1],
        outputRange: [-10, 10]
    });

    const arrowWidth = moveArrow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1]
    });

    Animated.loop(
        Animated.sequence([
            Animated.timing(moveArrow, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(moveArrow, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            })
        ])
    ).start();

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
            setImageName(result.assets![0].fileName);
        }
    };

    const uploadProfilePicture = () => {
        if (image) {
            const uploadTask = uploadFileToFirebase(image, `profile-pictures/${auth.currentUser?.uid}/${imageName ?? "user-profile-picture"}`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    switch (error.code) {
                        case "storage/unauthorized":
                            alert("File could not be uploaded due to user permissions (User likely not authenticated or logged in)");
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
                    await getDownloadURL(uploadTask.snapshot.ref).then(async (URL) => {
                        console.log("File available at", URL);
                        if (auth.currentUser) {
                            await updateProfile(auth.currentUser, {
                                photoURL: URL
                            });
                            await setPublicUserData({
                                photoURL: URL
                            });
                        }
                        navigation.navigate("SetupAcademicInformation");
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
                            transform: [{ translateY: arrowYVal }, { scaleX: arrowWidth }],
                        }}
                    >
                        <Image
                            className='w-full h-full'
                            style={{
                                opacity: localImageURI === "" ? 0.75 : 0
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
                        pressFunction={() => {
                            if (localImageURI !== "") {
                                uploadProfilePicture();
                            }
                        }}
                        label='Continue'
                        buttonStyle={`${localImageURI === "" ? "bg-gray-500" : "bg-red"} rounded-md w-1/2`}
                        textStyle={`${localImageURI === "" ? "text-gray-700" : "text-white"} text-lg font-bold`}
                        opacity={localImageURI === "" ? 1 : 0.8}
                    />
                </View>
                <InteractButton
                    pressFunction={() => navigation.navigate("SetupAcademicInformation")}
                    label='Skip For Now'
                    buttonStyle='bg-[#ddd] rounded-md w-10/12'
                    textStyle='text-[#3b3b3b] text-lg font-bold'
                />
            </View>
            <View>
                <Text className='text-white'>This can be changed later</Text>
            </View>
        </SafeAreaView>
    );
};

/**
 *
 */
const SetupAcademicInformation = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    const [major, setMajor] = useState<string>("");
    const [classYear, setClassYear] = useState<string>("");

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View>
                <View className='flex-col items-center'>
                    <Text className='text-white text-center text-3xl'>Academic Information</Text>
                    <Text className='text-white text-center text-lg mt-4'>We're all about fostering a community of learners. Tell us about your academic journey.</Text>
                </View>
                <KeyboardAvoidingView className='flex-col mt-10'>
                    <TextInputWithFloatingTitle
                        setTextFunction={(text: string) => {
                            if (text.length <= 64)
                                setMajor(text);
                        }}
                        inputValue={major}
                        title='Major*'
                        placeholderText='Major*'
                        titleStartY={20}
                        titleEndY={0}
                        maxCharacters={64}
                        blurTextStyle='text-white text-md'
                        focusTextStyle='text-white text-md'
                        textInputStyle="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1"
                    />
                    <TextInputWithFloatingTitle
                        setTextFunction={(text: string) => {
                            if (text.length <= 64)
                                setClassYear(text);
                        }}
                        inputValue={classYear}
                        title='Class Year*'
                        placeholderText='Class Year*'
                        titleStartY={20}
                        titleEndY={0}
                        maxCharacters={64}
                        blurTextStyle='text-white text-md'
                        focusTextStyle='text-white text-md'
                        textInputStyle="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mb-5"
                    />
                </KeyboardAvoidingView>
                <View className='flex-row'>
                    <InteractButton
                        pressFunction={() => navigation.goBack()}
                        label='Back'
                        buttonStyle='bg-[#ddd] rounded-md w-1/2'
                        textStyle='text-[#3b3b3b] text-lg font-bold'
                    />
                    <InteractButton
                        pressFunction={() => {
                            if (!(major === "" || classYear === "")) {
                                if (auth.currentUser) {
                                    setPublicUserData({
                                        major: major,
                                        classYear: classYear
                                    });
                                }
                                navigation.navigate("SetupCommittees")
                            }
                        }}
                        label='Continue'
                        buttonStyle={`${(major === "" || classYear === "") ? "bg-gray-500" : "bg-red"} rounded-md w-1/2`}
                        textStyle={`${(major === "" || classYear === "") ? "text-gray-700" : "text-white"} text-lg font-bold`}
                        opacity={(major === "" || classYear === "") ? 1 : 0.8}
                    />
                </View>
            </View>
            <View>
                <Text className='text-white'>{"* Items with an asterisk are required\nThese can be changed later"}</Text>
            </View>
        </SafeAreaView>
    );
};

const SetupCommittees = ({ navigation }: NativeStackScreenProps<ProfileSetupStackNavigatorParamList>) => {
    let chosenCommittees: Array<string> = [];

    /**
     * This should be fixed.
     * Currently, the button does not gray out when there are not committees chosen.
     * This is because states cannot be used inside a child component without unpredictable behavior.
     * A solution must be made to make it so the button can gray out (Set canContinue to false or true) if chosenCommittees.length > 0.
     * This cannot be done with passing a function inside of the child component, as that also causes erronious behavior.
     */
    const [canContinue, setCanContinue] = useState<boolean>(true);

    type CommitteeToggleStyle = {
        name: string,
        color: string
    }

    // color will eventually get replaced with logo source
    const committees: Array<CommitteeToggleStyle> = [
        {
            name: "Technical Affairs",
            color: "bg-gray-500"
        },
        {
            name: "MentorSHPE",
            color: "bg-slate-500"
        },
        {
            name: "Scholastic",
            color: "bg-yellow-500"
        },
        {
            name: "SHPEtinas",
            color: "bg-green-500"
        },
        {
            name: "Secretary",
            color: "bg-indigo-500"
        },
        {
            name: "Public Relations",
            color: "bg-pink-500"
        },
        {
            name: "Internal Affairs",
            color: "bg-blue-500"
        }
    ]

    const CommitteeToggle = ({ name, color }: CommitteeToggleStyle) => {
        const [isActive, setIsActive] = useState<boolean>(false);

        return (
            <TouchableOpacity
                className={`rounded-md w-full py-2 px-1 my-3 bg-white flex-row items-center justify-between shadow-md border-4 ${isActive ? "border-green-500" : "border-transparent"}`}
                activeOpacity={0.9}
                onPress={() => {
                    const index = chosenCommittees.indexOf(name)
                    setIsActive(!isActive);

                    if (isActive && index == -1)
                        chosenCommittees.push(name);
                    else if (index != -1)
                        chosenCommittees.splice(index, 1)
                }}
            >
                <View className='flex-row items-center'>
                    <View className={`h-10 w-10 rounded-full mr-2 ${color}`} />
                    <Text className={`font-bold text-center text-lg text-gray-600`}>{name}</Text>
                </View>
                <Image
                    className='h-10 w-10'
                    source={Images.CHECKMARK}
                    style={{
                        opacity: isActive ? 1 : 0
                    }}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View className='flex-col items-center'>
                <View className='flex-col items-center'>
                    <Text className='text-white text-center text-3xl'>Committees</Text>
                    <Text className='text-white text-center text-lg mt-4'>{"Are you part of any committees? If yes, we'd love to know which ones."}</Text>
                </View>
                <ScrollView
                    className='w-11/12 h-1/2 flex-col px-3 bg-[#b5b5cc] my-5 rounded-md'
                    persistentScrollbar
                    scrollToOverflowEnabled
                >
                    <View className='w-full h-full pb-28'>
                        {committees.map(({ name, color }: CommitteeToggleStyle) =>
                        (
                            <CommitteeToggle name={name} color={color} key={name} />
                        )
                        )}
                    </View>
                </ScrollView>
                <View className='flex-row w-10/12 justify-between mb-4'>
                    <InteractButton
                        pressFunction={() => navigation.goBack()}
                        label='Back'
                        buttonStyle='bg-[#ddd] rounded-md w-1/2'
                        textStyle='text-[#3b3b3b] text-lg font-bold'
                    />
                    <InteractButton
                        pressFunction={() => {
                            if (canContinue) {
                                if (auth.currentUser) {
                                    setPublicUserData({
                                        committees: chosenCommittees,
                                    });
                                    setPrivateUserData({
                                        completedAccountSetup: true,
                                    });
                                }
                                navigation.replace("HomeStack");
                            }
                        }}
                        label='Continue'
                        buttonStyle={`${canContinue ? "bg-red" : "bg-gray-500"} rounded-md w-1/2`}
                        textStyle={`${canContinue ? "text-white" : "text-gray-700"} text-lg font-bold`}
                        opacity={canContinue ? 1 : 0.8}
                    />
                </View>
                <InteractButton
                    pressFunction={() => {
                        if (auth.currentUser) {
                            setPublicUserData({
                                committees: chosenCommittees,
                            });
                            setPrivateUserData({
                                completedAccountSetup: true,
                            });
                        }
                        navigation.replace("HomeStack");
                    }}
                    label='Skip For Now'
                    buttonStyle='bg-[#ddd] rounded-md w-10/12'
                    textStyle='text-[#3b3b3b] text-lg font-bold'
                />
            </View>
        </SafeAreaView>
    );
};

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees };
