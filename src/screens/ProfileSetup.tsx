import { Text, View, KeyboardAvoidingView, Image, Animated, TouchableOpacity, ScrollView, Linking, BackHandler, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState, useContext, useLayoutEffect } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDownloadURL } from "firebase/storage";
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getCommittees, getUser, setPrivateUserData, setPublicUserData, uploadFileToFirebase } from '../api/firebaseUtils';
import { getBlobFromURI, selectFile, selectImage } from '../api/fileSelection';
import { UserContext } from '../context/UserContext';
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';
import InteractButton from '../components/InteractButton';
import { ProfileSetupStackParams } from '../types/Navigation';
import { Committee } from '../types/Committees';
import { Images } from '../../assets';
import { Octicons } from '@expo/vector-icons';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { CommonMimeTypes, validateFileBlob, validateName } from '../helpers/validation';
import SimpleDropDown from '../components/SimpleDropDown';

const safeAreaViewStyle = "flex-1 justify-between bg-dark-navy py-10 px-8";

type SetupNameAndBioProps = NativeStackScreenProps<ProfileSetupStackParams> & {
    navigateToLogin: () => void;
};

/** In this screen, the user will set their name and bio. The screen only let the user continue if their name is not empty. */
const SetupNameAndBio = ({ navigation, navigateToLogin }: SetupNameAndBioProps) => {
    const [name, setName] = useState<string>("");
    const [bio, setBio] = useState<string>("");

    const { setUserInfo } = useContext(UserContext)!;

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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View>
                    <TouchableOpacity
                        className="mb-4"
                        onPress={() => {
                            signOutUser();
                            navigateToLogin();
                        }}
                    >
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>
                    <View className='flex-col items-center mb-12'>
                        <Text className='text-white text-center text-3xl'>Tell Us About Yourself</Text>
                        <Text className='text-white text-center text-lg mt-4'>Please enter your full name{"\n"} below to get started.</Text>
                    </View>
                    <View className="flex-col">
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
                            focusTitleClassName='text-white pl-1 pb-1 text-xl'
                            textInputClassName="w-full rounded-md px-2 py-1 pb-3 bg-white h-6 items-center h-10 text-lg mb-4"
                        />

                        <TextInputWithFloatingTitle
                            setTextFunction={(text: string) => {
                                if (text.length <= 250)
                                    setBio(text)
                            }}
                            inputValue={bio}
                            title='Bio'
                            titleStartY={20}
                            titleEndY={0}
                            placeholderText='Write a short bio...'
                            maxCharacters={250}
                            blurTitleClassName='text-white text-md'
                            focusTitleClassName='text-white pl-1 pb-1 text-xl'
                            lineCount={5}
                            isMultiline
                            textInputClassName="w-full rounded-md px-2 py-1 pt-3 bg-white mb-4 h-32"
                        />
                        <InteractButton
                            onPress={async () => {
                                if (validateName(name, true)) {
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
                    </View>
                </View>
            </TouchableWithoutFeedback>
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
    const [loading, setLoading] = useState<boolean>(false);

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
        if (image && validateFileBlob(image, CommonMimeTypes.IMAGE_FILES, true)) {
            const uploadTask = uploadFileToFirebase(image, `user-docs/${auth.currentUser?.uid}/user-profile-picture`);
            setLoading(true);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    setLoading(false);
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
                        setLoading(false);
                        navigation.navigate("SetupAcademicInformation");
                    });
                });
        }
    };

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View>
                <TouchableOpacity
                    className="mb-4"
                    onPress={() => { navigation.goBack(); }}
                >
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>

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
                    <View className='w-10/12 mb-2'>
                        {loading && (
                            <ActivityIndicator className="mb-4" size={"large"} />
                        )}
                        <InteractButton
                            onPress={() => {
                                if (localImageURI !== "") {
                                    uploadProfilePicture();
                                }
                            }}
                            label='Continue'
                            buttonClassName={`${localImageURI === "" ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md`}
                            textClassName={`${localImageURI === "" ? "text-gray-700" : "text-white"} text-lg font-bold`}
                            opacity={localImageURI === "" ? 1 : 0.8}
                            underlayColor={`${localImageURI === "" ? "" : "#A22E2B"}`}
                        />
                    </View>
                    <InteractButton
                        onPress={() => navigation.navigate("SetupAcademicInformation")}
                        label='Skip For Now'
                        buttonClassName='justify-center items-center  rounded-md w-10/12'
                        textClassName='text-pale-orange text-lg font-bold'
                        underlayColor='transparent'
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};


/** This screen is where the user will enter their major and class-year. It will not let the user continue if either field is empty. */
const SetupAcademicInformation = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    const [major, setMajor] = useState<string>("");
    const [classYear, setClassYear] = useState<string>("");
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
    };

    const generateClassYears = (): { year: string }[] => {
        const currentYear = new Date().getFullYear();
        const years = [];

        for (let i = currentYear - 5; i <= currentYear + 8; i++) {
            years.push({ year: i.toString() });
        }

        return years;
    };

    const classYears = generateClassYears();

    const majors = [
        { major: 'Aerospace Engineering', iso: 'AERO' },
        { major: 'Architectural Engineering', iso: 'AREN' },
        { major: 'Biomedical Engineering', iso: 'BMEN' },
        { major: 'Chemical Engineering', iso: 'CHEN' },
        { major: 'Civil Engineering', iso: 'CHEN' },
        { major: 'Computer Engineering', iso: 'CPEN' },
        { major: 'Computer Science', iso: 'CSCE' },
        { major: 'Computing', iso: 'COMP' },
        { major: 'Data Engineering', iso: 'EC' },
        { major: 'Electrical Engineering', iso: 'ECEN' },
        { major: 'Electronic Systems Engineering Technology', iso: 'ESET' },
        { major: 'Environmental Engineering', iso: 'EVEN' },
        { major: 'Industrial & Systems Engineering', iso: 'ISEN' },
        { major: 'Industrial Distribution', iso: 'IDIS' },
        { major: 'Information Technology Service Management', iso: 'ITSV' },
        { major: 'Interdisciplinary Engineering', iso: 'ITDE' },
        { major: 'Manufacturing & Mechanical Engineering Technology', iso: 'MMET' },
        { major: 'Materials Science & Engineering', iso: 'MSEN' },
        { major: 'Mechanical Engineering', iso: 'MEEN' },
        { major: 'Multidisciplinary Engineering Technology', iso: 'MXET' },
        { major: 'Nuclear Engineering', iso: 'NUEN' },
        { major: 'Ocean Engineering', iso: 'OCEN' },
        { major: 'Petroleum Engineering', iso: 'PETE' },
        { major: 'Technology Management', iso: 'TCMG' }
    ];

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View>
                <TouchableOpacity
                    className="mb-4"
                    onPress={() => { navigation.goBack(); }}
                >
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>

                <View className='flex-col items-center'>
                    <Text className='text-white text-center text-3xl'>Academic Information</Text>
                    <Text className='text-white text-center text-lg mt-4'>We're all about fostering a community of learners. Tell us about your academic journey.</Text>
                </View>
                <View>
                    <View className='flex-col mt-10 justify-center h-52 z-20'>
                        <View className='absolute top-0 z-20 w-full'>
                            <SimpleDropDown
                                data={majors}
                                onSelect={(item) => setMajor(item.iso!)}
                                searchKey="major"
                                label="Select major"
                                isOpen={openDropdown === 'major'}
                                onToggle={() => toggleDropdown('major')}
                                title={'Major'}
                            />
                        </View>
                        <View className='absolute top-24 z-10 w-full'>
                            <SimpleDropDown
                                data={classYears}
                                onSelect={(item) => setClassYear(item.year)}
                                searchKey="year"
                                label="Select class year"
                                isOpen={openDropdown === 'year'}
                                onToggle={() => toggleDropdown('year')}
                                title={"Class Year"}
                            />
                        </View>
                    </View>

                    <View className='flex items-center z-5'>
                        <InteractButton
                            onPress={() => {
                                if (!(major === "" || classYear === "")) {
                                    if (auth.currentUser) {
                                        setPublicUserData({
                                            major: major,
                                            classYear: classYear
                                        });
                                    }
                                    navigation.navigate("SetupResume")
                                }
                            }}
                            label='Continue'
                            buttonClassName={`${(major === "" || classYear === "") ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md w-2/3 z-5`}
                            textClassName={`${(major === "" || classYear === "") ? "text-gray-700" : "text-white"} text-lg font-bold`}
                            opacity={(major === "" || classYear === "") ? 1 : 0.8}
                            underlayColor={`${(major === "" || classYear === "") ? "" : "#A22E2B"}`}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const SetupResume = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    const [resumeURL, setResumeURL] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const selectResume = async () => {
        const result = await selectFile();
        if (result) {
            const resumeBlob = await getBlobFromURI(result.assets![0].uri);
            return resumeBlob;
        }
        return null;
    }

    const uploadResume = (resumeBlob: Blob) => {
        if (validateFileBlob(resumeBlob, CommonMimeTypes.RESUME_FILES, true)) {
            setLoading(true)
            const uploadTask = uploadFileToFirebase(resumeBlob, `user-docs/${auth.currentUser?.uid}/user-resume`);

            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    setLoading(false);
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
                            setResumeURL(URL);
                            await setPublicUserData({
                                resumeURL: URL
                            });
                        }
                        setLoading(false);
                    });
                });
        }
    }
    const handleLinkPress = async (url: string) => {
        if (!url) {
            alert("No resume found");
            return;
        }

        await Linking.canOpenURL(url)
            .then(async (supported) => {
                if (supported) {
                    await Linking.openURL(url)
                        .catch((err) => console.error(`Issue opening url: ${err}`));
                } else {
                    console.warn(`Don't know how to open this URL: ${resumeURL}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View>
                <TouchableOpacity
                    className="mb-4"
                    onPress={() => { navigation.goBack(); }}
                >
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>

                <View className='flex-col items-center'>
                    <View className='flex-col items-center'>
                        <Text className='text-white text-center text-3xl'>Upload Your Resume</Text>
                        <Text className='text-white text-center text-lg mt-4'>Showcase Your Skills and Experience</Text>
                    </View>
                    <View className='flex-col w-64 h-44 my-8 border-2 border-gray-400 border-dashed rounded-md items-center justify-center'>
                        <InteractButton
                            onPress={async () => {
                                const selectedResume = await selectResume();
                                if (selectedResume) {
                                    uploadResume(selectedResume);
                                }
                            }}
                            label='Upload Resume'
                            buttonClassName={"bg-continue-dark justify-center items-center rounded-md"}
                            textClassName={"text-white text-lg font-bold"}
                            opacity={1}
                            underlayColor={"#A22E2B"}
                        />

                        <InteractButton
                            onPress={async () => { handleLinkPress(resumeURL!) }}
                            label='View Resume'
                            buttonClassName={`${!resumeURL ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md mt-5`}
                            textClassName={`${!resumeURL ? "text-gray-700" : "text-white"} text-lg font-bold`}
                            opacity={!resumeURL ? 1 : 0.8}
                            underlayColor={`${!resumeURL ? "" : "#A22E2B"}`}
                        />
                    </View>
                    <View className='w-10/12 mb-2'>
                        {loading && (
                            <ActivityIndicator className="mb-4" size={"large"} />
                        )}
                        <InteractButton
                            onPress={() => navigation.navigate("SetupCommittees")}
                            label='Continue'
                            buttonClassName={`${!resumeURL ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md`}
                            textClassName={`${!resumeURL ? "text-gray-700" : "text-white"} text-lg font-bold`}
                            opacity={!resumeURL ? 1 : 0.8}
                            underlayColor={`${!resumeURL ? "" : "#A22E2B"}`}
                        />
                    </View>
                    <InteractButton
                        onPress={() => navigation.navigate("SetupCommittees")}
                        label='Skip For Now'
                        buttonClassName='justify-center items-center  rounded-md w-10/12'
                        textClassName='text-pale-orange text-lg font-bold'
                        underlayColor='transparent'
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}


/**
 * This screen is where the user will choose which committees they're in, if any. The user can select committees, 
 * choose to skip, or select "None For Now".
 * Skipping and selecting "None For Now" will do the same thing and set their committees as ["None"]
 */
const SetupCommittees = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    const [canContinue, setCanContinue] = useState<boolean>(true);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [userCommittees, setUserCommittees] = useState<string[]>([]);

    const userContext = useContext(UserContext);
    const { setUserInfo } = userContext!;

    useEffect(() => {
        const fetchCommittees = async () => {
            const response = await getCommittees();
            setCommittees(response)
        }

        fetchCommittees();
    }, []);

    const handleCommitteeToggle = (firebaseDocName: string) => {
        setUserCommittees(prevCommittees => {
            if (prevCommittees.includes(firebaseDocName)) {
                return prevCommittees.filter(name => name !== firebaseDocName);
            } else {
                return [...prevCommittees, firebaseDocName];
            }
        });
    };

    useEffect(() => {
        setCanContinue(userCommittees.length > 0);
    }, [userCommittees]);


    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <View className='flex-col items-center'>
                <View className='flex-col items-center'>
                    <Text className='text-white text-center text-3xl'>Committees</Text>
                    <Text className='text-white text-center text-lg mt-4'>{"Are you part of any committees? If yes, we'd love to know which ones."}</Text>
                </View>
                <ScrollView
                    className='w-11/12 h-1/2 flex-col px-3 bg-[#b5b5cc2c] my-5 rounded-md'
                    persistentScrollbar
                    scrollToOverflowEnabled
                >
                    <View className='w-full h-full pb-28'>
                        {committees.map((committee: Committee) => (
                            <TouchableOpacity
                                key={committee.firebaseDocName}
                                onPress={() => handleCommitteeToggle(committee?.firebaseDocName!)}
                                className={`rounded-md w-full py-2 px-1 my-3 bg-white flex-row items-center justify-between border-4 ${userCommittees.includes(committee?.firebaseDocName!) ? "border-green-500 shadow-lg" : "border-transparent shadow-sm"}`}
                            >
                                <View className='flex-row items-center'>
                                    <View className={`h-10 w-10 rounded-full mr-2`} style={{ backgroundColor: committee.color ?? "#000" }} />
                                    <Text className={`font-bold text-center text-lg text-gray-600`}>{committee.name}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
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
                            if (canContinue) {
                                if (auth.currentUser) {
                                    await setPublicUserData({
                                        committees: userCommittees,
                                    });
                                    await setPrivateUserData({
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
                        buttonClassName={`${canContinue ? "bg-continue-dark" : "bg-gray-500"} justify-center items-center rounded-md w-1/2`}
                        textClassName={`${canContinue ? "text-white" : "text-gray-700"} text-lg font-bold`}
                        opacity={canContinue ? 1 : 0.8}
                        underlayColor={`${canContinue ? "#A22E2B" : ""}`}
                    />
                </View>
                <InteractButton
                    onPress={async () => {
                        if (auth.currentUser) {
                            await setPublicUserData({
                                committees: [],
                            });
                            await setPrivateUserData({
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

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees, SetupResume };
