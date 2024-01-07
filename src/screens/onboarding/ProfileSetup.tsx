import { Text, View, Image, Animated, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Octicons } from '@expo/vector-icons';
import { Circle, Svg } from 'react-native-svg';
import { UserContext } from '../../context/UserContext';
import { auth, functions } from '../../config/firebaseConfig';
import { getCommittees, getUser, setPrivateUserData, setPublicUserData } from '../../api/firebaseUtils';
import { getBlobFromURI, selectFile, selectImage, uploadFile } from '../../api/fileSelection';
import { updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { CommonMimeTypes, validateName } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import { calculateHexLuminosity } from '../../helpers/colorUtils';
import { Committee, getLogoComponent } from '../../types/Committees';
import { MAJORS, classYears } from '../../types/User';
import { ProfileSetupStackParams } from '../../types/Navigation';
import { Images } from '../../../assets';
import UploadFileIcon from '../../../assets/file-arrow-up-solid.svg';
import DownloadIcon from '../../../assets/arrow-down-solid.svg';
import TextInputWithFloatingTitle from '../../components/TextInputWithFloatingTitle';
import SimpleDropDown from '../../components/SimpleDropDown';
import InteractButton from '../../components/InteractButton';

const safeAreaViewStyle = "flex-1 justify-between bg-dark-navy py-10 px-8";

/** In this screen, the user will set their name and bio. The screen only let the user continue if their name is not empty. */
const SetupNameAndBio = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    const [name, setName] = useState<string>("");
    const [bio, setBio] = useState<string>("");
    ;
    const { signOutUser } = useContext(UserContext)!;

    useEffect(() => {
        if (!auth.currentUser?.uid) {
            navigation.navigate("LoginScreen");
        }
    }, [navigation]);

    return (
        <SafeAreaView className={safeAreaViewStyle}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View>
                    <TouchableOpacity
                        className="mb-4"
                        onPress={() => {
                            signOutUser(false);
                            navigation.navigate("LoginScreen");
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

    const onProfilePictureUploadSuccess = async (URL: string) => {
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

    }

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
                                    uploadFile(
                                        image!,
                                        CommonMimeTypes.IMAGE_FILES,
                                        `user-docs/${auth.currentUser?.uid}/user-profile-picture`,
                                        onProfilePictureUploadSuccess
                                    );
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
                                data={MAJORS}
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
                                disableSearch
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
    const [resumeName, setResumeName] = useState<string | null>(null);

    const progress = useRef(new Animated.Value(0)).current;
    const setProgress = (newProgress: number) => {
        if (newProgress <= 0) {
            progress.setValue(0);
        } else if (newProgress >= 100) {
            progress.setValue(100);
        } else {
            Animated.timing(progress, {
                toValue: newProgress,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    };

    const AnimatedCircle = Animated.createAnimatedComponent(Circle);
    const circumference = 2 * Math.PI * 45; // 45 is the radius of the circle
    const strokeDashoffset = progress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0]
    });

    const selectResume = async () => {
        const result = await selectFile();
        if (result) {
            const resumeBlob = await getBlobFromURI(result.assets![0].uri);
            setResumeName(result.assets![0].name);
            return resumeBlob;
        }

        return null;
    }

    const onResumeUploadSuccess = async (URL: string) => {
        console.log("File available at", URL);
        if (auth.currentUser) {
            setResumeURL(URL);
            await setPublicUserData({
                resumeURL: URL
            });
        }
        setLoading(false);
    }


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
                        <Text className='text-white text-center text-3xl'>Professional Information</Text>
                        <Text className='text-white text-center text-lg mt-4'>Showcase Your Skills and Experience</Text>
                    </View>

                    <View className='items-center'>
                        {resumeURL && (
                            <TouchableOpacity
                                className='mt-8'
                                onPress={async () => { handleLinkPress(resumeURL!) }}
                            >
                                <View className='relative flex-row items-center border-b border-white'>
                                    <Text className="text-white font-semibold text-lg">{resumeName}</Text>
                                    <View className='absolute left-full ml-1'>
                                        <DownloadIcon width={15} height={15} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity className="relative items-center justify-center rounded-full h-44 w-44 mb-10 mt-4"
                            onPress={async () => {
                                const selectedResume = await selectResume();
                                if (selectedResume) {
                                    uploadFile(
                                        selectedResume,
                                        CommonMimeTypes.RESUME_FILES,
                                        `user-docs/${auth.currentUser?.uid}/user-resume`,
                                        onResumeUploadSuccess,
                                        setProgress
                                    );
                                }
                            }}>
                            <Svg height="100%" width="100%" viewBox="0 0 100 100" className="absolute">
                                <Circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#ffffff"
                                    strokeWidth="4"
                                    fill="transparent"
                                />
                            </Svg>
                            <Svg height="100%" width="100%" viewBox="0 0 100 100" className="absolute">
                                <AnimatedCircle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#AEF359"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    transform="rotate(-90, 50, 50)"
                                />
                            </Svg>
                            <UploadFileIcon width={110} height={110} />
                        </TouchableOpacity>
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
    const [loading, setLoading] = useState<boolean>(false);

    const { setUserInfo } = useContext(UserContext)!;


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
            <View className='flex-col'>
                <TouchableOpacity
                    className="mb-4"
                    onPress={() => { navigation.goBack(); }}
                >
                    <Octicons name="chevron-left" size={30} color="white" />
                </TouchableOpacity>
                <View className='items-center'>
                    <View className='flex-col items-center'>
                        <Text className='text-white text-center text-3xl'>Committees</Text>
                        <Text className='text-white text-center text-lg mt-4'>{"Are you part of any committees? If yes, we'd love to know which ones."}</Text>
                    </View>
                    <ScrollView
                        className='w-11/12 h-1/2 flex-col bg-[#b5b5cc2c] my-5 rounded-md'
                        persistentScrollbar
                        scrollToOverflowEnabled
                    >
                        <View className='flex-wrap flex-row w-full h-full pb-28 justify-around pt-4'>
                            {committees.map((committee: Committee) => {
                                const isLight = (colorHex: string) => {
                                    const luminosity = calculateHexLuminosity(colorHex);
                                    return luminosity < 155;
                                };

                                const { LogoComponent, height, width } = getLogoComponent(committee.logo);
                                const isSelected = userCommittees.includes(committee.firebaseDocName!);

                                return (
                                    <TouchableOpacity
                                        key={committee.firebaseDocName}
                                        onPress={() => handleCommitteeToggle(committee?.firebaseDocName!)}
                                        className='flex-col rounded-md w-[45%]'
                                        style={{ backgroundColor: committee.color, minHeight: 90 }}
                                    >
                                        <View className='flex-1 rounded-md items-center' style={{ backgroundColor: "rgba(255,255,255,0.4)" }} >
                                            <View className='flex-1 items-center flex-row justify-center py-2'>
                                                {isSelected ? (
                                                    <View className="items-center justify-center h-10 w-10 rounded-full" style={{ backgroundColor: committee.color }}>
                                                        <Octicons name="check" size={30} color="white" />
                                                    </View>
                                                ) : (
                                                    <LogoComponent width={height / 2} height={width / 2} />

                                                )}
                                            </View>
                                            <Text className={`justify-end font-bold text-lg text-black text-${isLight(committee.color!) ? "white" : "black"}`}>{committee.name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View className='w-10/12 mb-2'>
                        <InteractButton
                            onPress={async () => {
                                if (canContinue && auth.currentUser) {
                                    setLoading(true);
                                    // Update committee member counts
                                    const committeeChanges = userCommittees.map(committeeName => ({
                                        committeeName,
                                        change: 1
                                    }));

                                    const updateCommitteeMembersCount = httpsCallable(functions, 'updateCommitteeMembersCount');
                                    await updateCommitteeMembersCount({ committeeChanges });

                                    // Save user data to firebase
                                    await setPublicUserData({
                                        committees: userCommittees,
                                    });
                                    await setPrivateUserData({
                                        completedAccountSetup: true,
                                    });

                                    // Save user to local storage and update user context
                                    const firebaseUser = await getUser(auth.currentUser.uid)
                                    await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                                    setUserInfo(firebaseUser); // Navigates to Home

                                    setLoading(false);
                                }
                            }}

                            label='Continue'
                            buttonClassName={`${!canContinue ? "bg-gray-500" : "bg-continue-dark"} justify-center items-center rounded-md`}
                            textClassName={`${!canContinue ? "text-gray-700" : "text-white"} text-lg font-bold`}
                            opacity={!canContinue ? 1 : 0.8}
                            underlayColor={`${!canContinue ? "" : "#A22E2B"}`}
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

                            const firebaseUser = await getUser(auth.currentUser?.uid!)
                            await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                            setUserInfo(firebaseUser); // Navigates to Home
                        }}
                        label='Skip For Now'
                        buttonClassName='justify-center items-center  rounded-md w-10/12'
                        textClassName='text-pale-orange text-lg font-bold'
                        underlayColor='transparent'
                    />
                    {loading && (
                        <ActivityIndicator className="mb-4" size={"large"} />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupCommittees, SetupResume };
