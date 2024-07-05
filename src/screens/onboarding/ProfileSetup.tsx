import { Text, View, Image, Animated, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Octicons } from '@expo/vector-icons';
import { Circle, Svg } from 'react-native-svg';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { getUser, setPrivateUserData, setPublicUserData, uploadFile } from '../../api/firebaseUtils';
import { getBlobFromURI, selectFile, selectImage } from '../../api/fileSelection';
import { updateProfile } from 'firebase/auth';
import { CommonMimeTypes, validateName } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import { MAJORS, classYears } from '../../types/user';
import { ProfileSetupStackParams } from '../../types/navigation';
import { Images } from '../../../assets';
import UploadFileIcon from '../../../assets/file-arrow-up-solid.svg';
import DownloadIcon from '../../../assets/arrow-down-solid_white.svg';
import IntramuralIcon from '../../../assets/intramural_white.svg';
import SocialIcon from '../../../assets/social_white.svg';
import StudyHoursIcon from '../../../assets/study_hour_white.svg';
import WorkshopIcon from '../../../assets/workshop_event_white.svg';
import VolunteerIcon from '../../../assets/volunteer_white.svg';
import TextInputWithFloatingTitle from '../../components/TextInputWithFloatingTitle';
import CustomDropDown from '../../components/CustomDropDown';
import InteractButton from '../../components/InteractButton';
import { EventType } from '../../types/events';
import { LinearGradient } from 'expo-linear-gradient';

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
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <SafeAreaView className='flex-1'>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View>
                        {/* Header */}
                        <View className='px-4 mt-5 flex-row items-center'>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("LoginScreen")}
                                activeOpacity={1}
                            >
                                <Octicons name="chevron-left" size={30} color="white" />
                            </TouchableOpacity>

                            <View className='flex-1 mx-5 flex-row'>
                                <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                                <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                                <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                                <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                                <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                            </View>
                        </View>

                        <View className='mx-8 mt-8'>
                            <Text className='text-white text-3xl font-bold'>Tell Us About Yourself</Text>
                            <Text className='text-white text-xl mt-2'>Enter your full name. Biography is displayed in your public profile.</Text>
                        </View>

                        <View className="mx-8 mt-10">
                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => {
                                    if (text.length <= 64)
                                        setName(text);
                                }}
                                inputValue={name}
                                title='Name*'
                                placeholderText='Name*'
                                placeHolderColor="white"
                                titleStartY={20}
                                titleEndY={-5}
                                maxCharacters={64}
                                blurTitleClassName='text-xl'
                                focusTitleClassName='text-white text-xl ml-1'
                                textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-14"
                            />

                            <TextInputWithFloatingTitle
                                setTextFunction={(text: string) => {
                                    if (text.length <= 250)
                                        setBio(text)
                                }}
                                inputValue={bio}
                                title='Bio'
                                titleStartY={20}
                                titleEndY={-5}
                                placeholderText='Write a short bio...'
                                maxCharacters={250}
                                lineCount={5}
                                isMultiline
                                blurTitleClassName='text-xl'
                                componentClassName="mt-4"
                                focusTitleClassName='text-white text-xl ml-1'
                                textInputClassName="text-xl text-white border-2 border-white rounded-lg pl-2 h-32"
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
                                opacity={name === "" ? 1 : 0.8}
                                buttonClassName={`justify-center items-center mt-8 rounded-xl h-14 ${name === "" ? "bg-grey-dark" : "bg-primary-orange"}`}
                                textClassName={`text-white font-semibold text-2xl text-white`}
                                underlayColor={`${name === "" ? "" : "#EF9260"}`}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </LinearGradient>
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
        setLoading(true);
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
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >

            <SafeAreaView className='flex-1'>
                {/* Header */}
                <View className='px-4 mt-5 flex-row items-center'>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        activeOpacity={1}
                    >
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>

                    <View className='flex-1 mx-5 flex-row'>
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                    </View>
                </View>

                <View className='mx-8 mt-8'>
                    <Text className='text-white text-3xl font-bold'>Howdy!</Text>
                    <Text className='text-white text-xl mt-2'>Upload a profile picture that will display to other members.</Text>
                </View>

                <View className="mx-8 mt-10">
                    {/* Upload Profile Picture */}
                    <View className='items-center'>
                        <TouchableOpacity
                            className='w-52 h-52 my-8'
                            activeOpacity={0.6}
                            onPress={async () => await selectProfilePicture()}
                        >
                            <Image
                                className="w-52 h-52 rounded-full"
                                defaultSource={Images.DEFAULT_USER_PICTURE}
                                source={localImageURI !== "" ? { uri: localImageURI as string } : Images.DEFAULT_USER_PICTURE}
                            />
                            <Animated.View
                                className='absolute w-52 h-52 items-center justify-center'
                                style={{
                                    transform: [{ translateY: arrowYVal }, { scaleX: arrowWidth }],
                                }}
                            >
                                <Image
                                    className='h-1/2 w-1/2'
                                    style={{
                                        opacity: localImageURI === "" ? 0.75 : 0
                                    }}
                                    source={Images.UPLOAD_ARROW}
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    <InteractButton
                        onPress={() => {
                            if (localImageURI !== "") {
                                setLoading(true);
                                uploadFile(
                                    image!,
                                    CommonMimeTypes.IMAGE_FILES,
                                    `user-docs/${auth.currentUser?.uid}/user-profile-picture`,
                                    onProfilePictureUploadSuccess
                                );
                            }
                        }}
                        label='Continue'
                        opacity={localImageURI === "" ? 1 : 0.8}
                        buttonClassName={`justify-center items-center mt-8 rounded-xl h-14 ${localImageURI === "" ? "bg-grey-dark" : "bg-primary-orange"}`}
                        textClassName={`text-white font-semibold text-2xl text-white`}
                        underlayColor={`${localImageURI === "" ? "" : "#EF9260"}`}
                    />
                    {loading && (
                        <ActivityIndicator className="mt-2" size="small" />
                    )}
                    <InteractButton
                        onPress={() => navigation.navigate("SetupAcademicInformation")}
                        label='Skip For Now'
                        buttonClassName='justify-center items-center mt-4'
                        textClassName='text-primary-orange text-xl font-semibold'
                        underlayColor='transparent'
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
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
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <SafeAreaView className='flex-1'>
                {/* Header */}
                <View className='px-4 mt-5 flex-row items-center'>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        activeOpacity={1}
                    >
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>

                    <View className='flex-1 mx-5 flex-row'>
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                    </View>
                </View>

                <View className='mx-8 mt-8'>
                    <Text className='text-white text-3xl font-bold'>Academic Information</Text>
                    <Text className='text-white text-xl mt-2'>Your major and class year will display in your public profile.</Text>
                </View>

                <View className="mx-8 mt-10">
                    <View className='flex-col justify-center h-52 z-20'>
                        <View className='absolute top-0 z-20 w-full'>
                            <CustomDropDown
                                data={MAJORS}
                                onSelect={(item) => setMajor(item.iso!)}
                                searchKey="major"
                                label="Select major"
                                isOpen={openDropdown === 'major'}
                                onToggle={() => toggleDropdown('major')}
                                title={'Major'}
                                dropDownClassName='top-20'
                                titleClassName='text-white'
                                textClassName='text-black font-semibold'
                            />
                        </View>
                        <View className='absolute top-24 z-10 w-full'>
                            <CustomDropDown
                                data={classYears}
                                onSelect={(item) => setClassYear(item.iso!)}
                                searchKey="year"
                                label="Select class year"
                                isOpen={openDropdown === 'year'}
                                onToggle={() => toggleDropdown('year')}
                                title={"Class Year"}
                                displayType='iso'
                                disableSearch
                                dropDownClassName='top-20'
                                titleClassName='text-white'
                                textClassName='text-black font-semibold'
                            />
                        </View>
                    </View>

                    <View className='z-5'>
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

                            opacity={(major === "" || classYear === "") ? 1 : 0.8}
                            buttonClassName={`justify-center items-center mt-8 rounded-xl h-14 ${(major === "" || classYear === "") ? "bg-grey-dark" : "bg-primary-orange"}`}
                            textClassName={`text-white font-semibold text-2xl text-white`}
                            underlayColor={`${(major === "" || classYear === "") ? "" : "#EF9260"}`}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
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
            await setPrivateUserData({
                resumeURL: URL
            });
        }
        setLoading(false);
    }


    return (
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <SafeAreaView className='flex-1'>
                {/* Header */}
                <View className='px-4 mt-5 flex-row items-center'>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        activeOpacity={1}
                    >
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>

                    <View className='flex-1 mx-5 flex-row'>
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-grey-light h-1 mx-1 rounded-md' />
                    </View>
                </View>

                <View className='mx-8 mt-8'>
                    <Text className='text-white text-3xl font-bold'>Professional Information</Text>
                    <Text className='text-white text-xl mt-2'>Your resume will be sent to companies for various opportunities. This can be changed later.</Text>
                </View>


                <View className="mx-8 mt-4">
                    <View className='items-center'>
                        {resumeURL && (
                            <TouchableOpacity
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
                            <View className='h-full w-full absolute top-10 left-14'>
                                <Text className='text-black font-extrabold text-xl'>pdf</Text>
                            </View>
                        </TouchableOpacity>

                        {loading && (
                            <ActivityIndicator className="mb-4" size={"small"} />
                        )}

                    </View>
                    <InteractButton
                        onPress={() => {
                            if (resumeURL) {
                                navigation.navigate("SetupInterests")
                            }
                        }}
                        label='Continue'
                        opacity={!resumeURL ? 1 : 0.8}
                        buttonClassName={`justify-center items-center rounded-xl h-14 ${!resumeURL ? "bg-grey-dark" : "bg-primary-orange"}`}
                        textClassName={`text-white font-semibold text-2xl text-white`}
                        underlayColor={`${!resumeURL ? "" : "#EF9260"}`}
                    />

                    <InteractButton
                        onPress={() => navigation.navigate("SetupInterests")}
                        label='Skip For Now'
                        buttonClassName='justify-center items-center mt-4'
                        textClassName='text-primary-orange text-xl font-semibold'
                        underlayColor='transparent'
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}

/**
 * This screen is where the user will choose which committees they're in, if any. The user can select committees, 
 * choose to skip, or select "None For Now".
 * Skipping and selecting "None For Now" will do the same thing and set their committees as ["None"]
 */
const SetupInterests = ({ navigation }: NativeStackScreenProps<ProfileSetupStackParams>) => {
    const [canContinue, setCanContinue] = useState<boolean>(true);
    const [userInterests, setUserInterests] = useState<EventType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { setUserInfo } = useContext(UserContext)!;


    const handleInterestToggle = (interest: EventType) => {
        setUserInterests(prevInterest => {
            if (prevInterest.includes(interest)) {
                return prevInterest.filter(name => name !== interest);
            } else {
                return [...prevInterest, interest];
            }
        });
    };

    useEffect(() => {
        setCanContinue(userInterests.length > 0);
    }, [userInterests]);


    const InterestButtons = ({ interestEvent, label, Icon }: {
        interestEvent: EventType;
        label: string;
        Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    }) => {
        const isSelected = userInterests.includes(interestEvent);
        return (
            <TouchableOpacity
                onPress={() => handleInterestToggle(interestEvent)}
                className='flex-col rounded-xl w-[45%] mb-8'
                style={{ minHeight: 90 }}
            >
                <View className={`flex-1 rounded-md items-center border-2 ${isSelected ? "border-primary-orange" : "border-white"}`} >
                    <View className='flex-1 items-center flex-row justify-center py-2'>
                        {isSelected ? (
                            <View className="items-center justify-center h-10 w-10 rounded-full">
                                <Octicons name="check" size={30} color="#FD652F" />
                            </View>
                        ) : (
                            <Icon width={35} height={35} />
                        )}
                    </View>
                    <Text className={`justify-end font-bold text-lg ${isSelected ? "text-primary-orange" : "text-white"}`}>{label}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <LinearGradient
            colors={['#191740', '#413CA6']}
            className="flex-1"
        >
            <SafeAreaView className='flex-1'>
                {/* Header */}
                <View className='px-4 mt-5 flex-row items-center'>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        activeOpacity={1}
                    >
                        <Octicons name="chevron-left" size={30} color="white" />
                    </TouchableOpacity>

                    <View className='flex-1 mx-5 flex-row'>
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                        <View className='flex-1 bg-primary-orange h-1 mx-1 rounded-md' />
                    </View>
                </View>

                <View className='mx-8 mt-8'>
                    <Text className='text-white text-3xl font-bold'>What are you interested in?</Text>
                    <Text className='text-white text-xl mt-2'>You will receive notifications for events related to your interests. This can be changed later.</Text>
                </View>

                <View className='mx-8'>
                    <View className='flex-wrap flex-row w-full justify-between mt-10'>
                        <InterestButtons interestEvent={EventType.VOLUNTEER_EVENT} label="Volunteering" Icon={VolunteerIcon} />
                        <InterestButtons interestEvent={EventType.INTRAMURAL_EVENT} label="Intramural" Icon={IntramuralIcon} />
                        <InterestButtons interestEvent={EventType.SOCIAL_EVENT} label="Socials" Icon={SocialIcon} />
                        <InterestButtons interestEvent={EventType.STUDY_HOURS} label="Study Hours" Icon={StudyHoursIcon} />
                        <InterestButtons interestEvent={EventType.WORKSHOP} label="Workshops" Icon={WorkshopIcon} />
                    </View>

                    <InteractButton
                        onPress={async () => {
                            if (canContinue && auth.currentUser) {
                                setLoading(true);
                                await setPublicUserData({
                                    interests: userInterests,
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
                        opacity={!canContinue ? 1 : 0.8}
                        buttonClassName={`justify-center items-center rounded-xl h-14 ${!canContinue ? "bg-grey-dark" : "bg-primary-orange"}`}
                        textClassName={`text-white font-semibold text-2xl text-white`}
                        underlayColor={`${!canContinue ? "" : "#EF9260"}`}
                    />

                    <InteractButton
                        onPress={async () => {
                            if (auth.currentUser) {
                                await setPublicUserData({
                                    interests: [],
                                });

                                await setPrivateUserData({
                                    completedAccountSetup: true,
                                });
                            }

                            const firebaseUser = await getUser(auth.currentUser?.uid!)
                            await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                            setUserInfo(firebaseUser); // Navigates to Home
                        }}
                        label='Skip For Now'
                        buttonClassName='justify-center items-center mt-4'
                        textClassName='text-primary-orange text-xl font-semibold'
                        underlayColor='transparent'
                    />

                    {loading && (
                        <ActivityIndicator className="mb-4" size="small" />
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

export { SetupNameAndBio, SetupProfilePicture, SetupAcademicInformation, SetupResume, SetupInterests };
