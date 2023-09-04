import { Text, View, KeyboardAvoidingView, Image, Animated, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDownloadURL } from "firebase/storage";
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getUser, setPrivateUserData, setPublicUserData, uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectImage } from '../api/fileSelection';
import { UserContext } from '../context/UserContext';
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';
import InteractButton from '../components/InteractButton';
import { ProfileSetupStackParams } from '../types/Navigation';
import { committeesList } from '../types/User';
import { Images } from '../../assets';
import { Octicons } from '@expo/vector-icons';

const safeAreaViewStyle = "flex-1 justify-between bg-dark-navy py-10 px-8";

/** In this screen, the user will set their name and bio. The screen only let the user continue if their name is not empty. */
const SetupNameAndBio = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    const [name, setName] = useState<string>("");
    const [bio, setBio] = useState<string>("");

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const signOutUser = async () => {
        signOut(auth)
            .then(() => {
                AsyncStorage.removeItem('@user')
                setUserInfo(undefined);
            })
            .catch((error) => console.error(error));
    };

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View>
                <TouchableOpacity onPress={() => {
                    signOutUser();
                    navigation.goBack()
                }}>
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>
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
                        blurTitleClassName='text-white text-md'
                        focusTitleClassName='text-white text-md'
                        textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mb-3"
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
                        blurTitleClassName='text-white text-md'
                        focusTitleClassName='text-white text-md'
                        lineCount={5}
                        isMultiline
                        textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mb-3"
                    />
                    <InteractButton
                        onPress={async () => {
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
                        buttonClassName={`${name === "" ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md`}
                        textClassName={`${name === "" ? "text-gray-700" : "text-white"} text-lg font-bold`}
                        opacity={name === "" ? 1 : 0.8}
                        underlayColor={`${name === "" ? "" : "#A22E2B"}`}
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
 * This profile picture will be uploaded to firebase storage when the user hits the "Continue" button.
 */
const SetupProfilePicture = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
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

    /**
     * This will launch the native image picker of the user's device and allow the user to crop it to an aspect ratio of 1:1.
     * When the user selects an image, it will prepare the image to be uploaded. 
     */
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
                        onPress={() => navigation.goBack()}
                        label='Back'
                        buttonClassName='justify-center items-center bg-[#ddd] rounded-md w-1/2'
                        textClassName='text-[#3b3b3b] text-lg font-bold'
                    />
                    <InteractButton
                        onPress={() => {
                            if (localImageURI !== "") {
                                uploadProfilePicture();
                            }
                        }}
                        label='Continue'
                        buttonClassName={`${localImageURI === "" ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md w-1/2`}
                        textClassName={`${localImageURI === "" ? "text-gray-700" : "text-white"} text-lg font-bold`}
                        opacity={localImageURI === "" ? 1 : 0.8}
                        underlayColor={`${localImageURI === "" ? "" : "#A22E2B"}`}
                    />
                </View>
                <InteractButton
                    onPress={() => navigation.navigate("SetupAcademicInformation")}
                    label='Skip For Now'
                    buttonClassName='justify-center items-center bg-[#ddd] rounded-md w-10/12'
                    textClassName='text-[#3b3b3b] text-lg font-bold'
                />
            </View>
            <View>
                <Text className='text-white'>This can be changed later</Text>
            </View>
        </SafeAreaView>
    );
};


/** This screen is where the user will enter their major and class-year. It will not let the user continue if either field is empty. */
const SetupAcademicInformation = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
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
                        blurTitleClassName='text-white text-md'
                        focusTitleClassName='text-white text-md'
                        textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1"
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
                        blurTitleClassName='text-white text-md'
                        focusTitleClassName='text-white text-md'
                        textInputClassName="bg-[#e4e4e4] border-2 border-gray-300 rounded-md pr-10 pl-1 mb-5"
                    />
                </KeyboardAvoidingView>
                <View className='flex-row'>
                    <InteractButton
                        onPress={() => navigation.goBack()}
                        label='Back'
                        buttonClassName='justify-center items-center bg-[#ddd] rounded-md w-1/2'
                        textClassName='text-[#3b3b3b] text-lg font-bold'
                    />
                    <InteractButton
                        onPress={() => {
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
                        buttonClassName={`${(major === "" || classYear === "") ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md w-1/2`}
                        textClassName={`${(major === "" || classYear === "") ? "text-gray-700" : "text-white"} text-lg font-bold`}
                        opacity={(major === "" || classYear === "") ? 1 : 0.8}
                        underlayColor={`${(major === "" || classYear === "") ? "" : "#A22E2B"}`}
                    />
                </View>
            </View>
            <View>
                <Text className='text-white'>{"* Items with an asterisk are required\nThese can be changed later"}</Text>
            </View>
        </SafeAreaView>
    );
};


/**
 * This screen is where the user will choose which committees they're in, if any. The user can select committees, 
 * choose to skip, or select "None For Now".
 * Skipping and selecting "None For Now" will do the same thing and set their committees as ["None"]
 */
const SetupCommittees = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    // User Context
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    // color will eventually get replaced with logo source
    type CommitteeListItemData = {
        id: number,
        name: string,
        color: string,
        isChecked: boolean,
    }

    const committeesListItems: Array<CommitteeListItemData> = committeesList.map((element) => { return { ...element, isChecked: false } })

    const [canContinue, setCanContinue] = useState<boolean>(true);
    const [committees, setCommittees] = useState<Array<CommitteeListItemData>>(committeesListItems);
    const [noneIsChecked, setNoneIsChecked] = useState<boolean>(false);
    let selectedCommittees: Array<string> = committees.filter((element: CommitteeListItemData) => element.isChecked).map((element: CommitteeListItemData) => element.name);

    const handleToggle = (id: number) => {
        let modifiedCommittees = committees.map((element) => {
            if (id === element.id) {
                return { ...element, isChecked: !element.isChecked }
            }
            return element;
        });
        setCommittees(modifiedCommittees);
        setNoneIsChecked(false);
    };

    const handleNonePressed = () => {
        if (!noneIsChecked) {
            let modifiedCommittees = committees.map((element) => {
                return { ...element, isChecked: false }
            });
            setCommittees(modifiedCommittees);
        }
        setNoneIsChecked(!noneIsChecked);
    };

    /**
     * Component used as a list item for each of the committees.
     *
     * @param committeeData - Data containing information including the ID, name, color, and whether or not the committee is checked.
     * @param onPress - Function that gets called when toggle is pressed. The id from committeeData will be passed to it
     */
    const CommitteeToggle = ({ committeeData, onPress }: { committeeData: CommitteeListItemData, onPress: Function, }) => {
        return (
            <TouchableOpacity
                className={`rounded-md w-full py-2 px-1 my-3 bg-white flex-row items-center justify-between border-4 ${committeeData.isChecked ? "border-green-500 shadow-lg" : "border-transparent shadow-sm"}`}
                activeOpacity={0.9}
                onPress={() => onPress(committeeData.id)}
            >
                <View className='flex-row items-center'>
                    <View className={`h-10 w-10 rounded-full mr-2`} style={{ backgroundColor: committeeData.color ?? "#000" }} />
                    <Text className={`font-bold text-center text-lg text-gray-600`}>{committeeData.name}</Text>
                </View>
                <Image
                    className='h-10 w-10'
                    source={Images.CHECKMARK}
                    style={{
                        opacity: committeeData.isChecked ? 1 : 0
                    }}
                />
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        setCanContinue(selectedCommittees.length > 0);
    }, [committees]);

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
                        {committees.map((committeeData: CommitteeListItemData) =>
                        (
                            <CommitteeToggle committeeData={committeeData} onPress={(id: number) => handleToggle(id)} key={committeeData.id} />
                        )
                        )}
                        <CommitteeToggle committeeData={{ id: 0, name: "None Right Now", color: "#f55", isChecked: noneIsChecked }} onPress={() => handleNonePressed()} key={0} />
                    </View>
                </ScrollView>
                <View className='flex-row w-10/12 justify-between mb-4'>
                    <InteractButton
                        onPress={() => navigation.goBack()}
                        label='Back'
                        buttonClassName='justify-center items-center bg-[#ddd] rounded-md w-1/2'
                        textClassName='text-[#3b3b3b] text-lg font-bold'
                    />
                    <InteractButton
                        onPress={async () => {
                            if (canContinue || noneIsChecked) {
                                if (auth.currentUser) {
                                    if (noneIsChecked) {
                                        setPublicUserData({
                                            committees: ["None"],
                                        });
                                    }
                                    else {
                                        setPublicUserData({
                                            committees: selectedCommittees,
                                        });
                                    }
                                    setPrivateUserData({
                                        completedAccountSetup: true,
                                    });
                                }
                                // On Register, save user to local
                                const authUser = await getUser(auth.currentUser?.uid!)
                                await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                                setUserInfo(authUser); // Navigates to Home
                            }
                        }}
                        label='Continue'
                        buttonClassName={`${canContinue || noneIsChecked ? "bg-continue-dark" : "bg-gray-500"} justify-center items-center rounded-md w-1/2`}
                        textClassName={`${canContinue || noneIsChecked ? "text-white" : "text-gray-700"} text-lg font-bold`}
                        opacity={canContinue || noneIsChecked ? 1 : 0.8}
                        underlayColor={`${canContinue || noneIsChecked ? "#A22E2B" : ""}`}
                    />
                </View>
                <InteractButton
                    onPress={async () => {
                        if (auth.currentUser) {
                            setPublicUserData({
                                committees: ["None"],
                            });
                            setPrivateUserData({
                                completedAccountSetup: true,
                            });
                        }
                        // On Register, save user to local

                        const authUser = await getUser(auth.currentUser?.uid!)
                        await AsyncStorage.setItem("@user", JSON.stringify(authUser));
                        setUserInfo(authUser); // Navigates to Home
                    }}
                    label='Skip For Now'
                    buttonClassName='justify-center items-center bg-[#ddd] rounded-md w-10/12'
                    textClassName='text-[#3b3b3b] text-lg font-bold'
                />
            </View>
        </SafeAreaView>
    );
};

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees };
