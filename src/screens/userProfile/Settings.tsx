import { View, Text, Image, ScrollView, TextInput, TouchableHighlight, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Pressable, Animated, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from "expo-image-picker";
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { setPublicUserData, setPrivateUserData, getUser, getCommittees, submitFeedback, isUsernameUnique, deleteAccount, uploadFile } from '../../api/firebaseUtils';
import { getBlobFromURI, selectFile, selectImage } from '../../api/fileSelection';
import { CommonMimeTypes, validateDisplayName, validateFileBlob, validateName, validateTamuEmail } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import { HomeStackParams } from '../../types/navigation';
import { Committee } from '../../types/committees';
import { MAJORS, classYears } from '../../types/user';
import { Images } from '../../../assets';
import DownloadIconBlack from '../../../assets/arrow-down-solid.svg';
import DownloadIconWhite from '../../../assets/arrow-down-solid_white.svg'
import UploadFileIconBlack from '../../../assets/file-arrow-up-solid-black.svg';
import UploadFileIconWhite from '../../../assets/file-arrow-up-solid.svg'

import { SettingsSectionTitle, SettingsButton, SettingsToggleButton, SettingsListItem, SettingsSaveButton, SettingsModal } from "../../components/SettingsComponents"
import CustomDropDown from '../../components/CustomDropDown';
import { Circle, Svg } from 'react-native-svg';
import DismissibleModal from '../../components/DismissibleModal';
import * as Clipboard from 'expo-clipboard';

/**
 * Settings entrance screen which has a search function and paths to every other settings screen
 */
const SettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, signOutUser } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    return (
        <ScrollView
            className={`flex-col ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center'
            }}
        >
            <StatusBar style={darkMode ? "light" : "dark"} />

            <SettingsButton
                iconName='brightness-6'
                mainText='Display'
                subText='Dark/Light theme'
                darkMode={darkMode}
                onPress={() => navigation.navigate("DisplaySettingsScreen")}
            />
            <SettingsButton
                iconName='account-box'
                mainText='Account'
                subText='Email, Password...'
                darkMode={darkMode}
                onPress={() => navigation.navigate("AccountSettingsScreen")}
            />
            <SettingsButton
                iconName='message-alert-outline'
                mainText='Feedback'
                subText='Help us by sending app feedback!'
                darkMode={darkMode}
                onPress={() => navigation.navigate("FeedbackSettingsScreen")}
            />
            <SettingsButton
                iconName='frequently-asked-questions'
                mainText='FAQ'
                subText='Frequently asked questions'
                darkMode={darkMode}
                onPress={() => navigation.navigate("FAQSettingsScreen")}
            />
            <SettingsButton
                iconName='information-outline'
                mainText='About'
                subText='Information about the app'
                darkMode={darkMode}
                onPress={() => navigation.navigate("AboutSettingsScreen")}
            />

            <SettingsButton
                mainText='Sign Out'
                iconName='exit-to-app'
                darkMode={darkMode}
                onPress={() => signOutUser(true)}
            />
        </ScrollView>
    )
}


/**
 * Screen where a user can edit a majority of their public info. This includes thing like their profile picture, name, display name, committees, etc...
 * These changes are synced in firebase.
 */
const ProfileSettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [loading, setLoading] = useState<boolean>(false);
    const [image, setImage] = useState<Blob | null>(null);
    const [showSaveButton, setShowSaveButton] = useState<boolean>(false);

    const defaultVals = {
        photoURL: "",
        displayName: "DISPLAY NAME",
        name: "NAME",
        bio: "Write a short bio...",
        major: "MAJOR",
        classYear: "CLASS YEAR",
        committees: [],
    }

    //Hooks used to save state of modified fields before user hits "save"
    const [photoURL, setPhotoURL] = useState<string | undefined>(userInfo?.publicInfo?.photoURL);
    const [resumeURL, setResumeURL] = useState<string | undefined>(userInfo?.private?.privateInfo?.resumeURL);
    const [displayName, setDisplayName] = useState<string | undefined>(userInfo?.publicInfo?.displayName);
    const [name, setName] = useState<string | undefined>(userInfo?.publicInfo?.name);
    const [bio, setBio] = useState<string | undefined>(userInfo?.publicInfo?.bio);
    const [major, setMajor] = useState<string | undefined>(userInfo?.publicInfo?.major);
    const [classYear, setClassYear] = useState<string | undefined>(userInfo?.publicInfo?.classYear);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [committeesData, setCommitteesData] = useState<Committee[]>([]);
    const [committees, setCommittees] = useState<string[]>(userInfo?.publicInfo?.committees || []);
    const [prevCommittees, setPrevCommittees] = useState<string[]>(userInfo?.publicInfo?.committees || []);


    // Modal options
    const [showNamesModal, setShowNamesModal] = useState<boolean>(false);
    const [showBioModal, setShowBioModal] = useState<boolean>(false);
    const [showAcademicInfoModal, setShowAcademicInfoModal] = useState<boolean>(false);
    const [showResumeModal, setShowResumeModal] = useState<boolean>(false);

    useEffect(() => {
        const fetchCommitteeData = async () => {
            const response = await getCommittees();
            setCommitteesData(response);
        }
        fetchCommitteeData();
    }, [])

    /**
     * Checks for any pending changes in user data.  
     * If any deviate from userInfo, display a "save" button which will save the changes to firebase.
     */
    useEffect(() => {
        if (
            photoURL != userInfo?.publicInfo?.photoURL
        ) {
            setShowSaveButton(true);
        }
        else {
            setShowSaveButton(false);
        }
    }, [photoURL]);

    const selectProfilePicture = async () => {
        await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        }).then(async (result) => {
            if (result) {
                const imageBlob = await getBlobFromURI(result.assets![0].uri);
                if (imageBlob && validateFileBlob(imageBlob, CommonMimeTypes.IMAGE_FILES, true)) {
                    setPhotoURL(result.assets![0].uri);
                    setImage(imageBlob);
                }
            }
        }).catch((err) => {
            // TypeError means user did not select an image
            if (err.name != "TypeError") {
                console.error(err);
            }
        });
    }

    const selectResume = async () => {
        const result = await selectFile();
        if (result) {
            const resumeBlob = await getBlobFromURI(result.assets![0].uri);
            return resumeBlob;
        }
        return null
    }

    const onProfilePictureUploadSuccess = async (URL: string) => {
        console.log("File available at", URL);
        if (auth.currentUser) {
            setPhotoURL(URL);
            await updateProfile(auth.currentUser, {
                photoURL: URL
            });
            await setPublicUserData({
                photoURL: URL
            });
        }
    }

    // toggle dropdown for class year and major
    const toggleDropdown = (dropdownKey: string) => {
        if (openDropdown === dropdownKey) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdownKey);
        }
    };

    const onResumeUploadSuccess = async (URL: string) => {
        console.log("File available at", URL);
        if (auth.currentUser) {
            setResumeURL(URL);
            await setPrivateUserData({
                resumeURL: URL
            });
        }

    }

    const saveChanges = async () => {
        setLoading(true)
        // upload profile picture
        if (image) {
            await uploadFile(
                image,
                CommonMimeTypes.IMAGE_FILES,
                `user-docs/${auth.currentUser?.uid}/user-profile-picture`,
                onProfilePictureUploadSuccess
            );
        }

        /**
         * This is some very weird syntax and very javascript specific, so here's an explanation for what's going on:
         * 
         * setPublicUserData() updates the fields that are in the object passed into it.
         * The spread operator (...) adds each key in an object to the parent object.
         * By adding a conditional and the && operator next to the child object, this essentially creates a "Conditional Key Addition".
         * This makes it so the information will not be overridden in Firebase if the value of a key is empty/undefined.
         */
        setPublicUserData({
            ...(photoURL !== undefined) && { photoURL: photoURL },
            ...(displayName !== undefined) && { displayName: displayName },
            ...(name !== undefined) && { name: name },
            ...(bio !== undefined) && { bio: bio },
            ...(major !== undefined) && { major: major },
            ...(classYear !== undefined) && { classYear: classYear },
            ...(committees !== undefined) && { committees: committees },
        })
            .then(async () => {
                if (auth.currentUser)
                    await updateProfile(auth.currentUser, {
                        displayName: displayName,
                        photoURL: photoURL,
                    })

                if (auth.currentUser?.uid) {
                    const firebaseUser = await getUser(auth.currentUser.uid);
                    if (firebaseUser) {
                        setUserInfo(firebaseUser);
                        await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                    }
                    else {
                        console.warn("firebaseUser returned as undefined when attempting to sync. Sync will be skipped.");
                    }
                }
            })
            .catch(err => console.error("Error attempting to save changes: ", err))
            .finally(() => {
                setLoading(false);
                setShowSaveButton(false);
            });

        setPrivateUserData({
            ...(resumeURL !== undefined) && { resumeURL: resumeURL },
        })
    }

    const findMajorByIso = (iso: string) => {
        const majorObj = MAJORS.find(major => major.iso === iso);
        return majorObj ? majorObj.major : null;
    };

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


    return (
        <View className='items-center'>
            <StatusBar style={darkMode ? "light" : "dark"} />
            {/* Names Modal */}
            <SettingsModal
                visible={showNamesModal}
                darkMode={darkMode}
                title='Names'
                onCancel={() => {
                    setDisplayName(userInfo?.publicInfo?.displayName);
                    setName(userInfo?.publicInfo?.name);
                    setShowNamesModal(false);
                }}
                onDone={async () => {
                    if (validateDisplayName(displayName, true) && validateName(name, true)) {
                        if (displayName === userInfo?.publicInfo?.displayName) {
                            saveChanges()
                            setShowNamesModal(false)
                        } else {
                            const isUnique = await isUsernameUnique(displayName!);
                            if (isUnique) {
                                saveChanges();
                                setShowNamesModal(false);
                            } else {
                                setDisplayName(userInfo?.publicInfo?.displayName);
                                alert("Display name is already taken. Please choose another one.");
                            }
                        }
                    }

                }}
                content={(
                    <KeyboardAvoidingView>
                        <View className='px-6 py-2'>
                            <Text className={`text-lg mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Display Name</Text>
                            <TextInput
                                className={`text-xl border-b-2 ${darkMode ? "text-white border-gray-300" : "text-black border-gray-700"}`}
                                onChangeText={(text: string) => setDisplayName(text)}
                                value={displayName}
                                autoCorrect={false}
                                multiline
                                inputMode='text'
                                maxLength={80}
                                placeholder='Display Name...'
                            />
                        </View>
                        <View className='px-6 py-2'>
                            <Text className={`text-lg mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Name</Text>
                            <TextInput
                                className={`text-xl border-b-2 ${darkMode ? "text-white border-gray-300" : "text-black border-gray-700"}`}
                                onChangeText={(text: string) => setName(text)}
                                value={name}
                                autoCorrect={false}
                                multiline
                                inputMode='text'
                                maxLength={80}
                                placeholder='Full Name..'
                            />
                        </View>
                    </KeyboardAvoidingView>
                )}
            />

            {/* Bio Modal */}
            <SettingsModal
                visible={showBioModal}
                darkMode={darkMode}
                title='Bio'
                onCancel={() => {
                    setBio(userInfo?.publicInfo?.bio ?? defaultVals.bio);
                    setShowBioModal(false);
                }}
                onDone={() => {
                    saveChanges();
                    setShowBioModal(false);
                }}
                content={(
                    <KeyboardAvoidingView className='px-6'>
                        <Text className={`text-lg mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Bio</Text>
                        <TextInput
                            className={`p-2 rounded-lg text-base ${darkMode ? "bg-secondary-bg-dark text-white" : "bg-secondary-bg-light text-black border border-black"}`}
                            onChangeText={(text: string) => {
                                if (text.length <= 250)
                                    setBio(text)
                            }}
                            value={bio}
                            multiline
                            numberOfLines={8}
                            placeholder='Write a short bio...'
                            placeholderTextColor={darkMode ? "#ddd" : "#000"}
                        />
                    </KeyboardAvoidingView>
                )}
            />
            {/* Academic Info Modal */}
            <SettingsModal
                visible={showAcademicInfoModal}
                darkMode={darkMode}
                title='Academics'
                onCancel={() => {
                    setMajor(userInfo?.publicInfo?.major ?? defaultVals.major);
                    setClassYear(userInfo?.publicInfo?.classYear ?? defaultVals.classYear);
                    setShowAcademicInfoModal(false);
                }}
                onDone={() => {
                    saveChanges();
                    setShowAcademicInfoModal(false)
                }}
                content={
                    (
                        <View className="items-center justify-center">
                            <View className='absolute top-0 z-20 w-[80%]'>
                                <CustomDropDown
                                    data={MAJORS}
                                    onSelect={(item) => setMajor(item.iso)}
                                    searchKey="major"
                                    label="Select major"
                                    isOpen={openDropdown === "major"}
                                    onToggle={() => toggleDropdown("major")}
                                    title={"Major"}
                                    selectedItemProp={{ iso: major, value: findMajorByIso(major!)! }}
                                    dropDownClassName={Platform.OS == "ios" ? "top-20" : undefined}
                                    darkMode={darkMode}
                                />
                            </View>
                            <View className='absolute top-24 z-10 w-[80%]'>
                                <CustomDropDown
                                    data={classYears}
                                    onSelect={(item) => setClassYear(item.iso)}
                                    searchKey="year"
                                    label="Select class year"
                                    isOpen={openDropdown === 'year'}
                                    onToggle={() => toggleDropdown('year')}
                                    title={"Class Year"}
                                    selectedItemProp={{ iso: classYear }}
                                    displayType='iso'
                                    dropDownClassName={Platform.OS == "ios" ? "top-20" : undefined}
                                    disableSearch
                                    darkMode={darkMode}
                                />
                            </View>
                        </View>

                    )
                }
            />

            {/* Resume Modal */}
            <SettingsModal
                visible={showResumeModal}
                onCancel={() => setShowResumeModal(false)}
                onDone={() => setShowResumeModal(false)}
                darkMode={darkMode}
                content={(
                    <View>
                        <View className='items-center'>
                            <TouchableOpacity className="relative items-center justify-center rounded-full h-44 w-44 mb-5 mt-4"
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
                                        stroke={darkMode ? "#a3a3a3" : "#000000"}
                                        strokeWidth="3"
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
                                {darkMode ? <UploadFileIconWhite width={110} height={110} /> : <UploadFileIconBlack width={110} height={110} />}
                            </TouchableOpacity>

                            {resumeURL && (
                                <TouchableOpacity onPress={async () => { handleLinkPress(resumeURL!) }}>
                                    <View className={`relative flex-row items-center border-b ${darkMode ? "border-white" : "border-black"}`}>
                                        <Text className={`font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>View Resume</Text>
                                        <View className='absolute left-full ml-1'>
                                            {darkMode ? <DownloadIconWhite width={15} height={15} /> : <DownloadIconBlack width={15} height={15} />}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            />
            <ScrollView className={`flex-col w-full pb-10 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
                <View className='py-10 w-full items-center'>
                    <TouchableOpacity activeOpacity={0.7} onPress={async () => await selectProfilePicture()}>
                        <Image
                            className='w-36 h-36 rounded-full'
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                        />
                        <View className='absolute bg-[#D4D4D4] p-0.5 right-0 bottom-0 rounded-full'>
                            <MaterialCommunityIcons name="file-edit-outline" size={40} color="#747474" />
                        </View>
                    </TouchableOpacity>
                </View>
                <SettingsButton
                    mainText='Display Name'
                    subText={displayName ?? defaultVals.displayName}
                    darkMode={darkMode}
                    onPress={() => setShowNamesModal(true)}
                />
                <SettingsButton
                    mainText='Name'
                    subText={name ?? defaultVals.name}
                    darkMode={darkMode}
                    onPress={() => setShowNamesModal(true)}
                />
                <SettingsButton
                    mainText='Bio'
                    subText={bio ? bio.length < 30 ? bio : bio.slice(0, 30) + "..." : defaultVals.bio}
                    darkMode={darkMode}
                    onPress={() => setShowBioModal(true)}
                />
                <SettingsSectionTitle text='Academic Info' darkMode={darkMode} />
                <SettingsButton
                    mainText='Major'
                    subText={major ?? defaultVals.major}
                    darkMode={darkMode}
                    onPress={() => setShowAcademicInfoModal(true)}
                />
                <SettingsButton
                    mainText='Class Year'
                    subText={classYear ?? defaultVals.classYear}
                    darkMode={darkMode}
                    onPress={() => setShowAcademicInfoModal(true)}
                />
                <SettingsSectionTitle text='SHPE Info' darkMode={darkMode} />
                <SettingsButton
                    mainText='Resume'
                    subText='Keep your resume updated!'
                    darkMode={darkMode}
                    onPress={() => setShowResumeModal(true)}
                />
                <View className='h-20' />
                {loading && <ActivityIndicator className='absolute top-0 bottom-0 left-0 right-0' size={100} />}
            </ScrollView>
            {showSaveButton &&
                <SettingsSaveButton
                    onPress={() => saveChanges()}
                />
            }
        </View>
    );
};

/**
 * Screen where user can modify how to the app looks. 
 * These changes are synced in firebase.
 */
const DisplaySettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [loading, setLoading] = useState<boolean>(false);
    const [darkModeToggled, setDarkModeToggled] = useState<boolean>(userInfo?.private?.privateInfo?.settings?.darkMode ?? false);
    const [systemDefaultToggled, setSystemDefaultToggled] = useState<boolean>(userInfo?.private?.privateInfo?.settings?.useSystemDefault ?? false);

    return (
        <ScrollView
            className={`flex-col ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center',
                minHeight: '100%',
            }}
        >
            <StatusBar style={darkMode ? "light" : "dark"} />
            <SettingsToggleButton
                mainText='Dark theme'
                subText='Changes display of entire app'
                isToggled={darkModeToggled}
                darkMode={darkMode}
                onPress={async () => {
                    setDarkModeToggled(!darkModeToggled);
                    setLoading(true);
                    await setPrivateUserData({
                        settings: {
                            darkMode: !darkMode,
                            useSystemDefault: false,
                        }
                    })
                        .then(async () => {
                            setUserInfo(prevUserInfo => ({
                                ...prevUserInfo,
                                private: {
                                    ...prevUserInfo?.private,
                                    privateInfo: {
                                        ...prevUserInfo?.private?.privateInfo,
                                        settings: {
                                            ...prevUserInfo?.private?.privateInfo?.settings,
                                            darkMode: !darkMode,
                                            useSystemDefault: false,
                                        }
                                    }
                                }
                            }));

                            await AsyncStorage.setItem("@user", JSON.stringify({
                                ...userInfo,
                                private: {
                                    ...userInfo?.private,
                                    privateInfo: {
                                        ...userInfo?.private?.privateInfo,
                                        settings: {
                                            ...userInfo?.private?.privateInfo?.settings,
                                            darkMode: !darkMode,
                                            useSystemDefault: false,
                                        }
                                    }
                                }
                            }));
                        })
                        .catch((err) => console.error(err))
                        .finally(() => {
                            setLoading(false);
                        });
                }}
                disabled={systemDefaultToggled}
            />

            <SettingsToggleButton
                mainText='Use system default'
                subText='Automatically switch based on system setting'
                isToggled={systemDefaultToggled}
                darkMode={darkMode}
                onPress={async () => {
                    setSystemDefaultToggled(!systemDefaultToggled);
                    setLoading(true);
                    await setPrivateUserData({
                        settings: {
                            useSystemDefault: !systemDefaultToggled
                        }
                    })
                        .then(async () => {
                            setUserInfo(prevUserInfo => ({
                                ...prevUserInfo,
                                private: {
                                    ...prevUserInfo?.private,
                                    privateInfo: {
                                        ...prevUserInfo?.private?.privateInfo,
                                        settings: {
                                            ...prevUserInfo?.private?.privateInfo?.settings,
                                            useSystemDefault: !systemDefaultToggled,
                                        }
                                    }
                                }
                            }));

                            await AsyncStorage.setItem("@user", JSON.stringify({
                                ...userInfo,
                                private: {
                                    ...userInfo?.private,
                                    privateInfo: {
                                        ...userInfo?.private?.privateInfo,
                                        settings: {
                                            ...userInfo?.private?.privateInfo?.settings,
                                            useSystemDefault: !systemDefaultToggled,
                                        }
                                    }
                                }
                            }));
                        })
                        .catch((err) => console.error(err))
                        .finally(() => {
                            setLoading(false);
                        });
                }}
            />
            {loading && <ActivityIndicator className='absolute top-0 bottom-0 left-0 right-0' size={100} />}
        </ScrollView>
    );
};

/**
 * Screen where user can both view information about their account and request a change of their email and/or password.
 * These changes will go through firebase where an email will be sent to the user. 
 */
const AccountSettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const deleteConfirmationText = "DELETECONFIRM";

    const [deleteText, setDeleteText] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    return (
        <ScrollView className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <SettingsListItem
                mainText='Email'
                subText={auth.currentUser?.email ?? "EMAIL"}
                darkMode={darkMode}
            />

            <SettingsButton
                mainText={userInfo?.publicInfo?.isEmailPublic ? "Make Email Private" : "Make Email Public"}
                subText={userInfo?.publicInfo?.isEmailPublic ? "Your email will no longer be visible" : "Your email will be visible to everyone"}
                onPress={
                    async () => {
                        const updatedPublicData = {
                            ...userInfo?.publicInfo,
                            isEmailPublic: !userInfo?.publicInfo?.isEmailPublic,
                            email: !userInfo?.publicInfo?.isEmailPublic ? auth.currentUser?.email || "" : "",
                        };

                        await setPublicUserData(updatedPublicData);

                        const updatedUserInfo = {
                            ...userInfo,
                            publicInfo: updatedPublicData,
                        };

                        await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                        setUserInfo(updatedUserInfo);
                        Alert.alert("Email visibility updated successfully");
                    }
                }
                darkMode={darkMode}
            />

            <SettingsButton
                mainText='Unique Identifier'
                subText={auth.currentUser?.uid ?? "UID"}
                darkMode={darkMode}
                onPress={async () => {
                    Clipboard.setStringAsync(auth.currentUser?.uid ?? "UID")
                        .then(() => Alert.alert("Copied", "UID Copied to Clipboard"));
                }}
            />
            <SettingsListItem
                mainText='Account Creation Time'
                subText={auth.currentUser?.metadata.creationTime}
                darkMode={darkMode}
            />

            {!validateTamuEmail(auth.currentUser?.email ?? "") &&
                <SettingsButton
                    mainText='Password Reset'
                    onPress={() => {
                        Alert.alert("Password Reset", "An email reset link will be sent to your email.")
                        sendPasswordResetEmail(auth, auth.currentUser?.email!)
                    }}
                    darkMode={darkMode}
                />
            }


            <SettingsButton
                mainText={"Delete Account"}
                mainTextColor='#F11'
                subText={"This action is irreversible"}
                onPress={() => {
                    setDeleteText("");
                    setShowDeleteModal(true);
                }}
                darkMode={darkMode}
            />


            <DismissibleModal
                visible={showDeleteModal}
                setVisible={setShowDeleteModal}
            >
                <View
                    className={`flex opacity-100 rounded-md px-6 pt-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-primary-bg-light"}`}
                    style={{ maxWidth: 350 }}
                >
                    {/* Title */}
                    <View className='flex-row items-center mb-4'>
                        <FontAwesome name="user" color={darkMode ? "white" : "black"} size={30} />
                        <Text className={`text-2xl font-bold ml-2 ${darkMode ? "text-white" : "text-black"}`}>Account Deletion</Text>
                    </View>

                    <Text className={`text-xl font-semibold ml-2 text-[#ff0000]`}>YOU WILL LOSE ALL YOUR POINTS IF YOU DELETE YOUR ACCOUNT</Text>
                    <Text className={`text-xl ml-2 mt-4 ${darkMode ? "text-neutral-100" : "text-black"}`}>Please type "{deleteConfirmationText}" to confirm.</Text>


                    <TextInput
                        className={`h-10 border-2 rounded-sm p-2 mt-5 ${darkMode ? "border-neutral-400 bg-neutral-800 text-white" : "border-neutral-800 bg-white text-black"}`}
                        placeholder='Enter Prompt'
                        placeholderTextColor={darkMode ? "#bbb" : "#000"}
                        onChangeText={setDeleteText}
                        value={deleteText}
                    />


                    <View className="flex-row justify-between items-center my-6 mx-5">
                        <TouchableOpacity
                            onPress={async () => {
                                Alert.alert("Account Deleted", "Your account has been successfully deleted.");
                                setShowDeleteModal(false);
                                await deleteAccount(auth.currentUser?.uid!);
                                await AsyncStorage.removeItem('@user');
                                setUserInfo(undefined);
                            }}
                            disabled={deleteText !== deleteConfirmationText}
                            className={`${deleteText !== deleteConfirmationText ? "bg-neutral-400" : "bg-red-700"} rounded-lg justify-center items-center px-4 py-1`}
                        >
                            <Text className={`text-xl font-bold px-2 ${deleteText !== deleteConfirmationText ? "text-neutral-300" : "text-white"}`}>DELETE</Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                            onPress={async () => {
                                setShowDeleteModal(false)
                            }} >
                            <Text className={`text-xl font-bold px-4 py-1 ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </DismissibleModal>
        </ScrollView>
    );
};

const FeedBackSettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;


    const [feedback, setFeedback] = useState('');

    const handleFeedbackSubmit = async () => {
        const response = await submitFeedback(feedback, userInfo!);
        if (response.success) {
            setFeedback('');
            alert('Feedback submitted successfully');
        } else {
            alert('Failed to submit feedback');
        }
    };

    return (
        <View className={`flex-1 selection:pt-10 px-6 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <Text className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`} >Tell us what can be improved</Text>
            <View className='items-center'>
                <TextInput
                    className={`py-4 px-2 rounded-lg w-[100%] h-32 ${darkMode ? "bg-secondary-bg-dark text-white" : "bg-secondary-bg-light border-gray-300 text-black"}`}
                    multiline
                    numberOfLines={4}
                    onChangeText={setFeedback}
                    value={feedback}
                    placeholder="Type your feedback here"
                    placeholderTextColor={darkMode ? "#ddd" : "#000"}
                />
            </View>
            <Pressable
                onPress={handleFeedbackSubmit}
                className={`mt-4 rounded-md w-[50%] py-2 items-center justify-center ${feedback.length === 0 ? 'bg-neutral-400' : 'bg-primary-blue'}`}
                disabled={feedback.length === 0}
            >
                <Text className={` text-lg font-semibold ${feedback.length === 0 ? 'text-neutral-200' : 'text-white'}`}>Submit FeedBack</Text>
            </Pressable>
        </View>
    );
};

const FAQSettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

    const toggleQuestion = (questionNumber: number) => {
        if (activeQuestion === questionNumber) {
            setActiveQuestion(null);
        } else {
            setActiveQuestion(questionNumber);
        }
    };

    const faqData: { question: string, answer: string }[] = [
        {
            question: "What resources does SHPE provide?",
            answer: "SHPE offers networking opportunities, professional development workshops, mentorship programs, scholarship opportunities, and community outreach initiatives."
        },
        {
            question: "How do I become an official SHPE member?",
            answer: "To become an official member, register on the SHPE national website, pay the annual membership fee, and join your local chapter activities."
        },
        {
            question: "What is the Technical Affairs Committee?",
            answer: "The Technical Affairs Committee organizes technical events and workshops, promotes STEM education, and provides members with opportunities to develop technical skills."
        },
        {
            question: "What is the MentorSHPE Committee?",
            answer: "The MentorSHPE Committee facilitates mentoring relationships between professional members and students, offering guidance, career advice, and academic support."
        },
        {
            question: "What is the Scholastic Committee?",
            answer: "The Scholastic Committee focuses on academic excellence by providing study sessions, educational resources, and academic advising to members."
        },
        {
            question: "What is the Secretary Committee?",
            answer: "The Secretary Committee is responsible for maintaining organization records, documenting meetings and events, and ensuring effective communication within the chapter."
        },
        {
            question: "What is the SHPEtinas Committee?",
            answer: "The SHPEtinas Committee empowers and supports female members of SHPE through networking events, workshops, and mentorship programs."
        },
        {
            question: "What do the points I acquire allow me to do?",
            answer: "Points earned through participation in events and activities can be used for priority access to certain events, eligibility for exclusive opportunities, and recognition within the organization."
        }
    ];

    return (
        <ScrollView className={`flex-1 px-4 pt-10 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            {faqData.map((faq, index) => (
                <TouchableOpacity
                    key={index}
                    className={`mb-2 p-4 rounded-lg ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${(activeQuestion === index && darkMode) && 'bg-secondary-bg-dark'}`}
                    onPress={() => toggleQuestion(index)}
                >
                    <View className='flex-row justify-between items-center px-2'>
                        <Text className={`text-xl font-semibold w-[85%] ${darkMode ? "text-white" : "text-black"}`}>{faq.question}</Text>
                        <View className='flex-1 items-center justify-center'>
                            <Octicons
                                name={activeQuestion === index ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={darkMode ? "white" : "black"}
                            />
                        </View>
                    </View>
                    {activeQuestion === index && (
                        <Text className={`mt-2 text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {faq.answer}
                        </Text>
                    )}
                </TouchableOpacity>
            ))}
            <View className='h-40' />
        </ScrollView>
    );
};
/**
 * This screen contains information about the app and info that may be useful to developers.
 */
const AboutSettingsScreen = ({ navigation }: NativeStackScreenProps<HomeStackParams>) => {
    const pkg: any = require("../../../package.json");
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;


    return (
        <ScrollView className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <SettingsListItem
                mainText='App Version'
                subText={`${pkg.name} ${pkg.version}`}
                darkMode={darkMode}
            />
            <SettingsListItem
                mainText='Platform'
                subText={`${Platform.OS} ${Platform.Version as string}`}
                darkMode={darkMode}
            />
            <SettingsButton
                mainText='Privacy Policy'
                darkMode={darkMode}
                onPress={() => handleLinkPress("https://jasonisazn.github.io/")}
            />
        </ScrollView>
    );
};



export { SettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, FeedBackSettingsScreen, FAQSettingsScreen, AboutSettingsScreen };
