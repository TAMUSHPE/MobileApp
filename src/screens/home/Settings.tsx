import { View, Text, Image, ScrollView, TextInput, TouchableHighlight, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StyleSheet, Pressable } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from "expo-image-picker";
import { Octicons } from '@expo/vector-icons';
import { UserContext } from '../../context/UserContext';
import { auth, functions } from '../../config/firebaseConfig';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { setPublicUserData, setPrivateUserData, getUser, getCommittees, submitFeedback } from '../../api/firebaseUtils';
import { getBlobFromURI, selectFile, selectImage, uploadFile } from '../../api/fileSelection';
import { CommonMimeTypes, validateDisplayName, validateFileBlob, validateName, validateTamuEmail } from '../../helpers/validation';
import { handleLinkPress } from '../../helpers/links';
import { getBadgeColor, isMemberVerified } from '../../helpers/membership';
import { MainStackParams } from '../../types/Navigation';
import { Committee } from '../../types/Committees';
import { MAJORS, classYears } from '../../types/User';
import { Images } from '../../../assets';
import ProfileBadge from '../../components/ProfileBadge';
import { SettingsSectionTitle, SettingsButton, SettingsToggleButton, SettingsListItem, SettingsSaveButton, SettingsModal } from "../../components/SettingsComponents"
import InteractButton from '../../components/InteractButton';
import SimpleDropDown from '../../components/SimpleDropDown';
import TwitterSvg from '../../components/TwitterSvg';

/**
 * Settings entrance screen which has a search function and paths to every other settings screen
 */
const SettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const { userInfo } = useContext(UserContext)!;

    const { name, roles, photoURL, chapterExpiration, nationalExpiration } = userInfo?.publicInfo ?? {};
    const isOfficer = roles ? roles.officer : false;

    const [isVerified, setIsVerified] = useState<boolean>(false);
    let badgeColor = getBadgeColor(isOfficer!, isVerified);

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <ScrollView
            className={`flex-col ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center'
            }}
        >
            <StatusBar style={darkMode ? "light" : "dark"} />

            <View className='flex-1 w-full px-4 mt-10 mb-4'>
                <TouchableOpacity
                    onPress={() => navigation.navigate("PublicProfile", { uid: auth.currentUser?.uid! })}
                >
                    <View className="flex-row">
                        <Image
                            className="flex w-16 h-16 rounded-full"
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                        />
                        <View className='ml-3 my-1'>
                            <View>
                                <View className="flex-row items-center">
                                    <Text className={`font-semibold text-2xl ${darkMode && "text-white"}`}>{name}</Text>
                                    {(isOfficer || isVerified) && <TwitterSvg color={badgeColor} className="ml-2" />}

                                </View>
                                <Text className={`text-md text-grey font-semibold ${darkMode && "text-white"}`}>View Profile</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

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
        </ScrollView>
    )
}


/**
 * Screen where a user can edit a majority of their public info. This includes thing like their profile picture, name, display name, committees, etc...
 * These changes are synced in firebase.
 */
const ProfileSettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext)!;
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
    const [resumeURL, setResumeURL] = useState<string | undefined>(userInfo?.publicInfo?.resumeURL);
    const [displayName, setDisplayName] = useState<string | undefined>(userInfo?.publicInfo?.displayName);
    const [name, setName] = useState<string | undefined>(userInfo?.publicInfo?.name);
    const [bio, setBio] = useState<string | undefined>(userInfo?.publicInfo?.bio);
    const [major, setMajor] = useState<string | undefined>(userInfo?.publicInfo?.major);
    const [classYear, setClassYear] = useState<string | undefined>(userInfo?.publicInfo?.classYear);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Dropdown for major and class year
    const [committeesData, setCommitteesData] = useState<Committee[]>([]);
    const [committees, setCommittees] = useState<string[]>(userInfo?.publicInfo?.committees || []);
    const [prevCommittees, setPrevCommittees] = useState<string[]>(userInfo?.publicInfo?.committees || []);


    // Modal options
    const [showNamesModal, setShowNamesModal] = useState<boolean>(false);
    const [showBioModal, setShowBioModal] = useState<boolean>(false);
    const [showAcademicInfoModal, setShowAcademicInfoModal] = useState<boolean>(false);
    const [showCommitteesModal, setShowCommitteesModal] = useState<boolean>(false);
    const [showResumeModal, setShowResumeModal] = useState<boolean>(false);

    const updateCommitteeMembersCount = httpsCallable(functions, 'updateCommitteeMembersCount');


    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

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
            await setPublicUserData({
                resumeURL: URL
            });
        }

    }

    const saveChanges = async () => {
        setLoading(true)
        // upload profile picture
        uploadFile(
            image!,
            CommonMimeTypes.IMAGE_FILES,
            `user-docs/${auth.currentUser?.uid}/user-resume-public`,
            onProfilePictureUploadSuccess
        );
        // uploadResume();

        /**
         * This is some very weird syntax and very javascript specific, so here's an explanation for what's going on:
         * 
         * setPublicUserData() updates the fields that are in the object passed into it.
         * The spread operator (...) adds each key in an object to the parent object.
         * By adding a conditional and the && operator next to the child object, this essentially creates a "Conditional Key Addition".
         * This makes it so the information will not be overridden in Firebase if the value of a key is empty/undefined.
         */
        await setPublicUserData({
            ...(photoURL !== undefined) && { photoURL: photoURL },
            ...(resumeURL !== undefined) && { resumeURL: resumeURL },
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
    }

    const updateCommitteeCounts = async () => {
        const addedCommittees = committees.filter(x => !prevCommittees.includes(x));
        const removedCommittees = prevCommittees.filter(x => !committees.includes(x));

        const committeeChanges = [
            ...addedCommittees.map(committeeName => ({ committeeName, change: 1 })),
            ...removedCommittees.map(committeeName => ({ committeeName, change: -1 }))
        ];

        if (committeeChanges.length > 0) {
            try {
                await updateCommitteeMembersCount({ committeeChanges });
                console.log("Committee member counts updated successfully.");
            } catch (error) {
                console.error("Error updating committee counts:", error);
            }
        }
    }

    const CommitteeListItemComponent = ({ committeeData, onPress, darkMode, isChecked, committeeIndex }: any) => {
        return (
            <TouchableHighlight
                className={`border-2 my-4 p-4 rounded-xl w-11/12 shadow-md shadow-black ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"} ${isChecked ? "border-green-400" : "border-transparent"}`}
                onPress={() => onPress()}
                underlayColor={darkMode ? "#7a7a7a" : "#DDD"}
            >
                <View className={`items-center flex-row justify-between`}>
                    <View className='flex-row items-center'>
                        <View className='h-8 w-8 mr-4 rounded-full' style={{ backgroundColor: committeeData.color }} />
                        <Text className={`text-2xl ${darkMode ? "text-gray-300" : "text-black"}`}>{committeeData.name}</Text>
                    </View>
                    {isChecked && <Text className={`text-xl ${darkMode ? "text-gray-300" : "text-black"}`}>{committeeIndex + 1}</Text>}
                </View>
            </TouchableHighlight>
        );
    };

    const handleCommitteeToggle = (name: string) => {
        setCommittees(prevCommittees => {
            const isCommitteeSelected = prevCommittees.includes(name);
            if (isCommitteeSelected) {
                return prevCommittees.filter(committee => committee !== name);
            } else {
                return [...prevCommittees, name];
            }
        });
    };

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
                onDone={() => {
                    if (validateDisplayName(displayName, true) && validateName(name, true)) {
                        saveChanges();
                        setShowNamesModal(false);
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
                            onChangeText={(text: string) => setBio(text)}
                            value={bio}
                            multiline
                            numberOfLines={8}
                            placeholder='Write a short bio...'
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
                        <View>
                            <View className='absolute top-0 z-20 w-full'>
                                <SimpleDropDown
                                    data={MAJORS}
                                    onSelect={(item) => setMajor(item.iso!)}
                                    searchKey="major"
                                    label="Select major"
                                    isOpen={openDropdown === 'major'}
                                    onToggle={() => toggleDropdown('major')}
                                    title={'Major'}
                                    selectedItemProp={{ value: major }}
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
                                    selectedItemProp={{ value: classYear }}
                                    disableSearch
                                />
                            </View>
                        </View>

                    )
                }
            />
            {/* Committees Modal */}
            <SettingsModal
                visible={showCommitteesModal}
                darkMode={darkMode}
                onCancel={() => {
                    setCommittees(userInfo?.publicInfo?.committees ?? defaultVals.committees);
                    setShowCommitteesModal(false);
                }}
                onDone={() => {
                    saveChanges();
                    updateCommitteeCounts();
                    setShowCommitteesModal(false);
                }}
                content={(
                    <View className='flex-col'>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                minHeight: "130%",
                            }}
                        >
                            <Text className={`text-lg px-4 mb-2 ${darkMode ? "text-gray-300" : "text-black"}`}>The number displayed beside each committee represents the order in which they will be displayed on your profile.</Text>
                            <View className='w-full h-full flex-col items-center'>
                                {committeesData.map((committeeData: Committee, index) => {
                                    const committeeIndex = committees.findIndex(
                                        userCommittee => userCommittee === committeeData.firebaseDocName
                                    );
                                    return (
                                        <CommitteeListItemComponent
                                            key={index}
                                            committeeIndex={committeeIndex}
                                            committeeData={committeeData}
                                            darkMode={darkMode}
                                            isChecked={committees.includes(committeeData?.firebaseDocName!)}
                                            committees={committees ?? defaultVals.committees}
                                            onPress={() => handleCommitteeToggle(committeeData?.firebaseDocName!)}
                                        />
                                    )
                                })}
                            </View>
                        </ScrollView>
                    </View>
                )}
            />
            {/* Resume Modal */}
            <SettingsModal
                visible={showResumeModal}
                onCancel={() => setShowResumeModal(false)}
                onDone={() => setShowResumeModal(false)}
                content={(
                    <View>
                        <InteractButton
                            label='Upload Resume'
                            onPress={async () => {
                                saveChanges();
                                const selectedResume = await selectResume();
                                if (selectedResume) {
                                    uploadFile(
                                        selectedResume,
                                        CommonMimeTypes.RESUME_FILES,
                                        `user-docs/${auth.currentUser?.uid}/user-resume`,
                                        onResumeUploadSuccess
                                    )
                                }
                            }}
                        />
                        <InteractButton
                            label='View Resume'
                            onPress={async () => {
                                console.log(resumeURL);
                                handleLinkPress(resumeURL!);
                            }}
                        />
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
                <View className={`border max-w-11/12 rounded-3xl shadow-sm shadow-black p-3 mx-3 my-3 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                    <Text className={`text-2xl mb-4 ${darkMode ? "text-white" : "text-black"}`}>Committees</Text>
                    <View className='flex-row flex-wrap'>
                        {committees?.map((committeeDocName, index) => {
                            const committeeData = committeesData.find(c => c.firebaseDocName === committeeDocName);
                            return (
                                <ProfileBadge
                                    badgeClassName='p-2 max-w-2/5 rounded-full mr-1 mb-2'
                                    text={committeeData?.name || "Unknown Committee"}
                                    badgeColor={committeeData?.color || ""}
                                    key={index}
                                />
                            );
                        })}

                        <TouchableHighlight
                            onPress={() => {
                                setPrevCommittees(committees)
                                setShowCommitteesModal(true)
                            }}
                            className='p-2 w-1/4 rounded-full mb-2 bg-[#FD551A]' underlayColor={"#FCA788"}
                        >
                            <Text className='text-white text-center'>+</Text>
                        </TouchableHighlight>
                    </View>
                </View>
                <SettingsButton
                    mainText='Resume'
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
const DisplaySettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [loading, setLoading] = useState<boolean>(false);
    const [darkModeToggled, setDarkModeToggled] = useState<boolean>(userInfo?.private?.privateInfo?.settings?.darkMode ?? false);

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode

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
                            darkMode: !darkMode
                        }
                    })
                        .then(async () => {
                            if (auth.currentUser?.uid) {
                                await getUser(auth.currentUser?.uid)
                                    .then(async (firebaseUser) => {
                                        if (firebaseUser) {
                                            setUserInfo(firebaseUser);
                                            await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                                        }
                                        else {
                                            console.warn("firebaseUser returned as undefined when attempting to sync. Sync will be skipped.");
                                        }
                                    })
                                    .catch(err => console.error(err));
                            }
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
const AccountSettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <ScrollView className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <SettingsListItem
                mainText='Email'
                subText={auth.currentUser?.email ?? "EMAIL"}
                darkMode={darkMode}
            />
            <SettingsListItem
                mainText='Unique Identifier'
                subText={auth.currentUser?.uid ?? "UID"}
                darkMode={darkMode}
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
        </ScrollView>
    );
};

const FeedBackSettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const [feedback, setFeedback] = useState('');
    const { userInfo } = useContext(UserContext)!;

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
        <View className="flex-1 selection:pt-10 px-6 bg-primary-bg-light">
            <Text className='text-xl font-bold mb-2'>Tell us what can be improved</Text>
            <View className='items-center'>
                <TextInput
                    className="border bg-white border-gray-300 py-4 px-2 rounded-lg w-[100%] h-32"
                    multiline
                    numberOfLines={4}
                    onChangeText={setFeedback}
                    value={feedback}
                    placeholder="Type your feedback here"
                />
            </View>
            <Pressable
                onPress={handleFeedbackSubmit}
                className={`mt-4 rounded-md w-[50%] py-2 items-center justify-center ${feedback.length === 0 ? 'bg-gray-300' : 'bg-pale-blue'}`}
                disabled={feedback.length === 0}
            >
                <Text className='text-white text-lg font-semibold'>Submit FeedBack</Text>
            </Pressable>
        </View>
    );
};

const FAQSettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

    const toggleQuestion = (questionNumber: number) => {
        if (activeQuestion === questionNumber) {
            setActiveQuestion(null);
        } else {
            setActiveQuestion(questionNumber);
        }
    };

    const faqData = [
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
        <ScrollView className='flex-1 px-4 bg-primary-bg-light py-10'>
            {faqData.map((faq, index) => (
                <TouchableOpacity
                    key={index}
                    className={`mb-2 p-4 rounded-lg ${activeQuestion === index ? 'bg-blue-100' : 'bg-white'}`}
                    onPress={() => toggleQuestion(index)}
                >
                    <View className='flex-row justify-between items-center px-2'>
                        <Text className='text-xl font-semibold w-[85%]'>{faq.question}</Text>
                        <View className='flex-1 items-center justify-center'>
                            <Octicons
                                name={activeQuestion === index ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color='black'
                            />
                        </View>
                    </View>
                    {activeQuestion === index && (
                        <Text className='text-gray-600 mt-2 text-lg'>
                            {faq.answer}
                        </Text>
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};
/**
 * This screen contains information about the app and info that may be useful to developers.
 */
const AboutSettingsScreen = ({ navigation }: NativeStackScreenProps<MainStackParams>) => {
    const pkg: any = require("../../../package.json");
    const { userInfo } = useContext(UserContext)!;
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

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
        </ScrollView>
    );
};



export { SettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, FeedBackSettingsScreen, FAQSettingsScreen, AboutSettingsScreen };
