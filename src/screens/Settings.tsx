import { View, Text, Image, ScrollView, TextInput, TouchableHighlight, TouchableOpacity, SafeAreaView, Switch, ActivityIndicator, Modal } from 'react-native';
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
import { validateTamuEmail } from '../helpers/validation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextInputWithFloatingTitle from '../components/TextInputWithFloatingTitle';

/**
 * Button used for navigation or creating a screen where a user can edit their information
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText  - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode - Whether or not the button should display in dark mode. Will default to false
 * @param onPress  - Function that is called when button is pressed. Defaults to logging "Button Pressed"
 */
const SettingsButton = ({ iconName, mainText, subText, darkMode, onPress }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText?: string, subText?: string, darkMode?: boolean, onPress?: Function }) => {
    return (
        <TouchableHighlight
            onPress={() => onPress ? onPress() : console.log(`${mainText} Button Pressed`)}
            underlayColor={darkMode ? "#444" : "#DDD"}
            className='w-full h-24 justify-center px-3'
        >
            <View className='flex-row my-2 items-center'>
                {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                <View className="ml-3 flex-col">
                    <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText ?? "Default Text"}</Text>
                    {subText && <Text className={`text-lg ${darkMode ? "text-[#BBB]" : "text-[#444]"}`}>{subText}</Text>}
                </View>
            </View>
        </TouchableHighlight>
    );
};

/**
 * Button used for user to toggle on/off features aka modifying boolean values for their account
 * @param iconName           - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText           - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText            - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode           - Whether or not the button should display in dark mode. Will default to false
 * @param onPress            - Function that is called when button is pressed. Defaults to logging "Button Pressed"
 * @param isInitiallyToggled - Sets whether or not the button is toggled on/off on render. This is useful when a user is modifying a currently established boolean value
 */
const SettingsToggleButton = ({ iconName, mainText, subText, darkMode, onPress, isInitiallyToggled }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText?: string, subText?: string, darkMode?: boolean, onPress?: () => any, isInitiallyToggled?: boolean }) => {
    const [isToggled, setIsToggled] = useState<boolean>(isInitiallyToggled ?? false);

    const handleToggle = () => {
        onPress ? onPress() : console.log("Toggle Button Pressed");
        setIsToggled(!isToggled);
    }

    return (
        <TouchableHighlight
            onPress={() => handleToggle()}
            underlayColor={darkMode ? "#444" : "#DDD"}
            className='w-full h-24 justify-center px-3'
        >
            <View className='flex-row justify-between'>
                <View className='flex-row my-2 items-center'>
                    {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                    <View className="ml-3 flex-col">
                        <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText ?? "Default Text"}</Text>
                        {subText && <Text className={`text-lg ${darkMode ? "text-[#BBB]" : "text-[#444]"}`}>{subText}</Text>}
                    </View>
                </View>
                <Switch
                    onValueChange={() => handleToggle()}
                    value={isToggled}
                />
            </View>
        </TouchableHighlight>
    );
};

/**
 * List Item used for just displaying information. Same style as settings buttons
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText  - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode - Whether or not the button should display in dark mode. Will default to false
 */
const SettingsListItem = ({ iconName, mainText, subText, darkMode }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText?: string, subText?: string, darkMode?: boolean }) => {
    return (
        <View className='w-full h-24 justify-center px-3'>
            <View className='flex-row my-2 items-center'>
                {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                <View className="ml-3 flex-col">
                    <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText ?? "Default Text"}</Text>
                    {subText && <Text className={`text-lg ${darkMode ? "text-[#BBB]" : "text-[#444]"}`}>{subText}</Text>}
                </View>
            </View>
        </View>
    );
};

/**
 * Save Button used on every screen which a user modifies important data
 * @param onPress - Function to be called when button is pressed
 */
const SettingsSaveButton = ({ onPress }: { onPress?: () => any }) => {
    return (
        <TouchableHighlight
            onPress={() => onPress ? onPress() : console.log("Save Button Pressed")}
            className='w-4/6 p-3 absolute bottom-3 bg-blue-600 rounded-full items-center'
            underlayColor={"#48ABFF"}
            activeOpacity={1}
        >
            <View className='flex-row items-center justify-center'>
                <MaterialCommunityIcons name={"floppy"} size={40} color="white" />
                <Text className='text-white text-3xl ml-2'>Save</Text>
            </View>
        </TouchableHighlight>
    );
};

const SettingsModal = ({ visible, onCancel, onDone, title, content, darkMode }: { visible: boolean, onCancel: () => any, onDone: () => any, title?: string, content?: React.JSX.Element, darkMode?: boolean }) => {
    return (
        <Modal
            className='bg-[#F00]'
            visible={visible}
            transparent
            animationType='slide'
            onRequestClose={() => onCancel()}
        >
            <SafeAreaView className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}  rounded-t-xl h-full box-shadow-md`}>
                {/* Header */}
                <View className='flex-row justify-between mx-1 my-4'>
                    <TouchableHighlight
                        className='rounded-4xl rounded-4xl px-8 py-2'
                        onPress={() => onCancel()}
                        underlayColor={"#BBB"}
                    >
                        <Text className={`${darkMode ? "text-white" : "text-black"} text-xl font-bold`}>Cancel</Text>
                    </TouchableHighlight>
                    <Text className='font-bold'>{title}</Text>
                    <TouchableHighlight
                        className='rounded-2xl px-8 py-2'
                        onPress={() => onDone()}
                        underlayColor={"#BBB"}
                    >
                        <Text className={`${darkMode ? "text-continue-dark" : "text-continue-light"} text-xl font-bold`}>Done</Text>
                    </TouchableHighlight>
                </View>
                {/* Modal Content */}
                <View>
                    {content ?? (<Text className={`${darkMode ? "text-white" : "text-black"} text-center text-4xl`}>A user will edit their settings here</Text>)}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

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
                className='rounded-full w-11/12 p-4 mb-5 mt-2 bg-[#E9E9E9]'
                underlayColor={"#ccd3d8"}
            >
                <View className='flex-row items-center'>
                    <MaterialCommunityIcons name="text-box-search-outline" size={30} color="#78818a" />
                    <Text className='text-xl ml-4 text-[#78818a]'>Search settings...</Text>
                </View>
            </TouchableHighlight>
            <SettingsButton
                iconName='pencil-circle'
                mainText='Profile'
                subText='Photo, Display Name, etc..'
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
                subText='Email, Password..'
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

    /**
     * Hooks used to save state of modified fields before user hits "save"
     */
    const [photoURL, setPhotoURL] = useState<string>(userInfo?.publicInfo?.photoURL ?? "PHOTO URL");

    // Names
    const [displayName, setDisplayName] = useState<string>(userInfo?.publicInfo?.displayName ?? "DISPLAY NAME");
    const [name, setName] = useState<string>(userInfo?.publicInfo?.name ?? "NAME");

    // Bio
    const [bio, setBio] = useState<string>(userInfo?.publicInfo?.bio ?? "BIO");

    // Academic Info
    const [major, setMajor] = useState<string>(userInfo?.publicInfo?.major ?? "MAJOR");
    const [classYear, setClassYear] = useState<string>(userInfo?.publicInfo?.classYear ?? "MAJOR");

    // Modal options
    const [showNamesModal, setShowNamesModal] = useState<boolean>(false);
    const [showBioModal, setShowBioModal] = useState<boolean>(false);
    const [showAcademicInfoModal, setShowAcademicInfoModal] = useState<boolean>(false);

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
        await setPublicUserData({
            displayName: displayName,
            name: name,
            bio: bio,
            photoURL: photoURL,
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
            <ScrollView
                className={`flex-col pb-10 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
                contentContainerStyle={{
                    alignItems: 'center'
                }}
            >
                <View className='py-10 w-full items-center'>
                    <TouchableOpacity activeOpacity={0.7} onPress={async () => await selectProfilePicture()}>
                        <Image
                            className='w-32 h-32 rounded-full'
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                        />
                        <View className='absolute bg-[#D4D4D4] p-0.5 right-0 bottom-0 rounded-full'>
                            <MaterialCommunityIcons name="file-edit-outline" size={40} color="#747474" />
                        </View>
                    </TouchableOpacity>
                </View>
                <SettingsModal
                    visible={showNamesModal}
                    onCancel={() => {
                        setShowNamesModal(false);

                        // Reset fields to default
                        setDisplayName(userInfo?.publicInfo?.displayName ?? "DISPLAY NAME");
                        setName(userInfo?.publicInfo?.name ?? "NAME");
                    }}
                    onDone={() => {
                        setShowNamesModal(false);
                    }}
                    content={(
                        <View>
                            <TextInputWithFloatingTitle
                                setTextFunction={(text) => setName(text)}
                                inputValue={name}
                                title="Name"
                            />
                            <TextInputWithFloatingTitle
                                setTextFunction={(text) => setName(text)}
                                inputValue={name}
                                title="Name"
                            />
                        </View>
                    )}
                />
                <SettingsButton
                    mainText='Display Name'
                    subText={displayName}
                    darkMode={darkMode}
                    onPress={() => setShowNamesModal(true)}
                />
                <SettingsButton
                    mainText='Name'
                    subText={name}
                    darkMode={darkMode}
                    onPress={() => setShowNamesModal(true)}
                />
                <SettingsButton
                    mainText='Bio'
                    subText={bio.length < 30 ? bio : bio.slice(0, 30) + "..."}
                    darkMode={darkMode}
                    onPress={() => setShowBioModal(true)}
                />
                <SettingsButton
                    mainText='Major'
                    subText={major}
                    darkMode={darkMode}
                    onPress={() => setShowAcademicInfoModal(true)}
                />
                <SettingsButton
                    mainText='Class Year'
                    subText={classYear}
                    darkMode={darkMode}
                    onPress={() => setShowAcademicInfoModal(true)}
                />
                <View className={`border max-w-11/12 rounded-lg p-3 mx-3 my-3 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
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
                        <TouchableHighlight onPress={() => console.log("Add Committees Button Pressed")} className='p-2 w-1/3 rounded-full mb-2 bg-[#FD551A]' underlayColor={"#FCA788"}>
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
        <ScrollView className={`py-10 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <Text className={`px-6 text-xl ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Info</Text>
            <SettingsListItem
                mainText='Unique Identifier'
                subText={auth.currentUser?.uid ?? "UID"}
                darkMode={darkMode}
            />
            <Text className={`px-6 mt-6 text-xl ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Authentication</Text>
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
            <Text className={`text-3xl py-2 ${darkMode ? "text-white" : "text-black"}`}>{`${pkg.name} ${pkg.version}`}</Text>
        </ScrollView>
    );
};


export { SettingsScreen, SearchSettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutScreen };

