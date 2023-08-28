import { View, Text, Image, ScrollView, TextInput, TouchableHighlight, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SettingsStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { setPublicUserData, setPrivateUserData, getUser, uploadFileToFirebase } from '../api/firebaseUtils';
import { getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from "expo-image-picker";
import { getBlobFromURI, selectImage } from '../api/fileSelection';
import ProfileBadge from '../components/ProfileBadge';
import { committeesList } from '../types/User';
import { validateDisplayName, validateName, validateTamuEmail } from '../helpers/validation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SettingsSectionTitle, SettingsButton, SettingsToggleButton, SettingsListItem, SettingsSaveButton, SettingsModal } from "../components/SettingsComponents"


const SettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo } = useContext(UserContext) ?? {};
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <ScrollView
            className={`flex-col ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center'
            }}
        >
            <StatusBar style={darkMode ? "light" : "dark"} />
            <View className='w-full py-8 px-4 flex-row items-center justify-between'>
                <View>
                    <Text className={`text-4xl ${darkMode ? "text-white" : "text-black"}`}>{userInfo?.publicInfo?.displayName}</Text>
                    <Text className={`text-xl ${darkMode ? "text-white" : "text-black"}`}>{userInfo?.publicInfo?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("ProfileSettingsScreen")}>
                    <Image
                        className='w-24 h-24 rounded-full'
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                </TouchableOpacity>
            </View>
            <TouchableHighlight
                onPress={() => navigation.navigate("SearchSettingsScreen")}
                className={`rounded-full w-11/12 p-4 mb-5 mt-2 bg-[#E9E9E9]`}
                underlayColor={"#ccd3d8"}
            >
                <View className='flex-row items-center'>
                    <MaterialCommunityIcons name="text-box-search-outline" size={30} color="#78818a" />
                    <Text className={`text-xl ml-4 text-[#78818a]`}>Search settings...</Text>
                </View>
            </TouchableHighlight>
            <SettingsButton
                iconName='pencil-circle'
                mainText='Profile'
                subText='Photo, Display Name, etc...'
                darkMode={darkMode}
                onPress={() => navigation.navigate("ProfileSettingsScreen")}
            />
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
                onPress={() => alert("Feature Unimplemented")}
            />
            <SettingsButton
                iconName='frequently-asked-questions'
                mainText='FAQ'
                subText='Frequently asked questions'
                darkMode={darkMode}
                onPress={() => alert("Screen does not currently exist")}
            />
            <SettingsButton
                iconName='information-outline'
                mainText='About'
                subText='Information about the app'
                darkMode={darkMode}
                onPress={() => navigation.navigate("AboutScreen")}
            />
        </ScrollView>
    )
}

const SearchSettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    alert("Settings Search and Settings Transition Unimplemented")
    return (
        <SafeAreaView>

        </SafeAreaView>
    );
};

const ProfileSettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext) ?? {};
    const [loading, setLoading] = useState<boolean>(false);
    const [image, setImage] = useState<Blob | null>(null);
    const [imageName, setImageName] = useState<string | null | undefined>(null);
    const [showSaveButton, setShowSaveButton] = useState<boolean>(false);

    const defaultVals = {
        photoURL: "",
        displayName: "DISPLAY NAME",
        name: "NAME",
        bio: "BIO",
        major: "MAJOR",
        classYear: "CLASS YEAR",
        committees: ["No Committees Found"],
    }

    //Hooks used to save state of modified fields before user hits "save"
    const [photoURL, setPhotoURL] = useState<string | undefined>(userInfo?.publicInfo?.photoURL);

    // Names
    const [displayName, setDisplayName] = useState<string | undefined>(userInfo?.publicInfo?.displayName);
    const [name, setName] = useState<string | undefined>(userInfo?.publicInfo?.name);

    // Bio
    const [bio, setBio] = useState<string | undefined>(userInfo?.publicInfo?.bio);

    // Academic Info
    const [major, setMajor] = useState<string | undefined>(userInfo?.publicInfo?.major);
    const [classYear, setClassYear] = useState<string | undefined>(userInfo?.publicInfo?.classYear);

    // SHPE Info
    const [committees, setCommittees] = useState<Array<string> | undefined>(userInfo?.publicInfo?.committees);

    // Modal options
    const [showNamesModal, setShowNamesModal] = useState<boolean>(false);
    const [showBioModal, setShowBioModal] = useState<boolean>(false);
    const [showAcademicInfoModal, setShowAcademicInfoModal] = useState<boolean>(false);
    const [showCommitteesModal, setShowCommitteesModal] = useState<boolean>(false);

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    useEffect(() => {
        if (
            photoURL != userInfo?.publicInfo?.photoURL ||
            displayName != userInfo?.publicInfo?.displayName ||
            name != userInfo?.publicInfo?.name ||
            bio != userInfo?.publicInfo?.bio ||
            major != userInfo?.publicInfo?.major ||
            classYear != userInfo?.publicInfo?.classYear
        ) {
            setShowSaveButton(true);
        }
        else {
            setShowSaveButton(false);
        }
    }, [photoURL, displayName, name, bio, major, classYear]);

    const selectProfilePicture = async () => {
        const result = await selectImage({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result) {
            const imageBlob = await getBlobFromURI(result.assets![0].uri);
            setPhotoURL(result.assets![0].uri);
            setImage(imageBlob);
            setImageName(result.assets![0].fileName);
        }
    }

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
                    });
                });
        }
    }

    const saveChanges = async () => {
        setLoading(true)
        uploadProfilePicture();

        /**
         * This is some very weird syntax and very javascript specific, so here's an explanation for what's going on:
         * 
         * setPublicUserData() updates the fields that are in the object passed into it.
         * The spread operator (...) adds each key in an object to the parent object.
         * By adding a conditional and the && operator next to the child object, this essentially creates a "Conditional Key Addition".
         * This makes it so the information will not be overridden in Firebase if the value of a key is empty/undefined.
         */
        await setPublicUserData({
            ...(displayName !== undefined) && { displayName: displayName },
            ...(name !== undefined) && { name: name },
            ...(bio !== undefined) && { bio: bio },
            ...(photoURL !== undefined) && { photoURL: photoURL },
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
                    setUserInfo ? setUserInfo(firebaseUser) : console.warn("setUserInfo() is undefined");
                    await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                }
            })
            .catch(err => console.error("Error attempting to save changes: ", err))
            .finally(() => {
                setLoading(false);
                setShowSaveButton(false);
            });
    }

    return (
        <View className='items-center'>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView className={`flex-col pb-10 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
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
                        // TODO Make alert messages more verbose
                        if (validateDisplayName(displayName) && validateName(name))
                            setShowNamesModal(false);
                        else if (!validateDisplayName(displayName))
                            alert("Invalid Display Name. Display Name must not be empty and must be less than 80 characters long.");
                        else if (!validateName(name))
                            alert("Invalid Name. Name must not be empty and must be less than 80 characters long.");
                    }}
                    content={(
                        <View>
                            <View className='px-6 py-2'>
                                <Text className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Display Name</Text>
                                <TextInput
                                    className={`text-xl ${darkMode ? "text-white" : "text-black"}`}
                                    onChangeText={(text: string) => setDisplayName(text)}
                                    value={displayName}
                                    autoCorrect={false}
                                />
                            </View>
                            <View className='px-6 py-2'>
                                <Text className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Name</Text>
                                <TextInput
                                    className={`text-xl ${darkMode ? "text-white" : "text-black"}`}
                                    onChangeText={(text: string) => setName(text)}
                                    value={name}
                                    autoCorrect={false}
                                />
                            </View>
                        </View>
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
                    onDone={() => setShowBioModal(false)}
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
                    onDone={() => setShowAcademicInfoModal(false)}
                />
                {/* Committees Modal */}
                <SettingsModal
                    visible={showCommitteesModal}
                    darkMode={darkMode}
                    onCancel={() => {
                        setCommittees(userInfo?.publicInfo?.committees ?? defaultVals.committees);
                        setShowCommitteesModal(false);
                    }}
                    onDone={() => setShowCommitteesModal(false)}
                />
                <View className='py-10 w-full items-center'>
                    <TouchableOpacity activeOpacity={0.7} onPress={async () => await selectProfilePicture()}>
                        <Image
                            className='w-40 h-40 rounded-full'
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
                <View className={`border max-w-11/12 rounded-3xl p-3 mx-3 my-3 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                    <Text className={`text-2xl mb-4 ${darkMode ? "text-white" : "text-black"}`}>Committees</Text>
                    <View className='flex-row flex-wrap'>
                        {userInfo?.publicInfo?.committees?.map((committeeName: string, index: number) => {
                            const committeeInfo = committeesList.find(element => element.name == committeeName);
                            return (
                                <ProfileBadge
                                    badgeClassName='p-2 max-w-2/5 rounded-full mr-1 mb-2'
                                    text={committeeName}
                                    badgeColor={committeeInfo ? committeeInfo?.color : ""}
                                    key={index}
                                />
                            )
                        })}
                        <TouchableHighlight onPress={() => setShowCommitteesModal(true)} className='p-2 w-1/3 rounded-full mb-2 bg-[#FD551A]' underlayColor={"#FCA788"}>
                            <Text className='text-white text-center'>+</Text>
                        </TouchableHighlight>
                    </View>
                </View>
                <View className='h-20' />
                {loading && <ActivityIndicator className='absolute top-0 bottom-0' size={100} />}
            </ScrollView>
            {showSaveButton &&
                <SettingsSaveButton
                    onPress={() => saveChanges()}
                />
            }
        </View>
    );
};

const DisplaySettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const userContext = useContext(UserContext)
    const { userInfo, setUserInfo } = userContext ?? {};
    const [loading, setLoading] = useState<boolean>(false);

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

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
                isInitiallyToggled={darkMode}
                darkMode={darkMode}
                onPress={async () => {
                    setLoading(true)
                    await setPrivateUserData({
                        settings: {
                            darkMode: !darkMode
                        }
                    })
                        .then(async () => {
                            if (auth.currentUser?.uid) {
                                await getUser(auth.currentUser?.uid)
                                    .then(async (firebaseUser) => {
                                        setUserInfo && firebaseUser ? setUserInfo(firebaseUser) : console.warn("setUserInfo() is undefined");
                                        await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                                    })
                                    .catch(err => console.error(err));
                            }
                        })
                        .catch((err) => console.error(err))
                        .finally(() => setLoading(false));
                }}
            />
            {loading && <ActivityIndicator className='absolute top-0 bottom-0' size={100} />}
        </ScrollView>
    );
};

const AccountSettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext) ?? {};
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <ScrollView className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <SettingsSectionTitle text='Info' darkMode={darkMode} />
            <SettingsListItem
                mainText='Unique Identifier'
                subText={auth.currentUser?.uid ?? "UID"}
                darkMode={darkMode}
            />
            <SettingsSectionTitle text='Authentication' darkMode={darkMode} />
            <SettingsButton
                mainText='Change Email'
                subText={auth.currentUser?.email ?? "EMAIL"}
                onPress={() => alert("This button's function is unimplemented")}
                darkMode={darkMode}
            />
            {!validateTamuEmail(auth.currentUser?.email ?? "") &&
                <SettingsToggleButton
                    mainText='Use TAMU Email'
                    subText={userInfo?.publicInfo?.tamuEmail ?? "No TAMU email set"}
                    onPress={() => alert("This button's function is unimplemented")}
                    darkMode={darkMode}
                />
            }
            <SettingsButton
                mainText='Password Reset'
                onPress={() => alert("This button's function is unimplemented")}
                darkMode={darkMode}
            />
        </ScrollView>
    );
};

const AboutScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const pkg: any = require("../../package.json");
    const { userInfo } = useContext(UserContext) ?? {};
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    return (
        <ScrollView className={`p-6 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <Text className={`text-3xl py-2 ${darkMode ? "text-white" : "text-black"}`}>{`${pkg.name} ${pkg.version}`}</Text>
        </ScrollView>
    );
};


export { SettingsScreen, SearchSettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutScreen };

