import { View, Text, Image, ScrollView, TextInput, TouchableHighlight, TouchableOpacity, SafeAreaView, Switch, ActivityIndicator } from 'react-native';
import React, { useContext, useState } from 'react';
import { SettingsStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { setPublicUserData, setPrivateUserData, getUser } from '../api/firebaseUtils';

/**
 * 
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode - Whether or not the button should display in dark mode. Will default to false
 * @param onPress - Function that is called when button is pressed. Defaults to logging "Button Pressed"
 */
const SettingsNavigationButton = ({ iconName, mainText, subText, darkMode, onPress }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText: string, subText?: string, darkMode?: boolean, onPress?: Function }) => {
    return (
        <TouchableHighlight
            onPress={() => onPress ? onPress() : console.log("Button Pressed")}
            underlayColor="#DDD"
            className='w-full h-24 justify-center px-3'
        >
            <View className='flex-row my-2 items-center'>
                {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                <View className="ml-3 flex-col">
                    <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText}</Text>
                    {subText && <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{subText}</Text>}
                </View>
            </View>
        </TouchableHighlight>
    );
};

/**
 * 
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param subText - The smaller text to be displayed on the button. This should add more details to what the button does
 * @param darkMode - Whether or not the button should display in dark mode. Will default to false
 * @param onPress - Function that is called when button is pressed. Defaults to logging "Button Pressed"
 * @param isInitiallyToggled - Sets whether or not the button is toggled on/off on render. This is useful when a user is modifying a boolean value
 */
const SettingsToggleButton = ({ iconName, mainText, subText, darkMode, onPress, isInitiallyToggled }: { iconName?: keyof typeof MaterialCommunityIcons.glyphMap, mainText: string, subText?: string, darkMode?: boolean, onPress?: Function, isInitiallyToggled?: boolean }) => {
    const [isToggled, setIsToggled] = useState<boolean>(isInitiallyToggled ?? false);

    const handleToggle = () => {
        onPress ? onPress() : console.log("Toggle Button Pressed");
        setIsToggled(!isToggled);
    }

    return (
        <TouchableHighlight
            onPress={() => handleToggle()}
            underlayColor="#DDD"
            className='w-full h-24 justify-center px-3'
        >
            <View className='flex-row justify-between'>
                <View className='flex-row my-2 items-center'>
                    {iconName && <MaterialCommunityIcons name={iconName} size={46} color={darkMode ? "white" : "black"} />}
                    <View className="ml-3 flex-col">
                        <Text className={`text-2xl ${darkMode ? "text-white" : "text-black"}`}>{mainText}</Text>
                        {subText && <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{subText}</Text>}
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

const SettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo } = useContext(UserContext) ?? {};

    return (
        <ScrollView
            className={`flex-col ${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center'
            }}
        >
            <View className='w-full py-8 px-4 flex-row items-center justify-between'>
                <View>
                    <Text className={`text-4xl ${userInfo?.private?.privateInfo?.settings?.darkMode ? "text-white" : "text-black"}`}>{userInfo?.publicInfo?.displayName}</Text>
                    <Text className={`text-xl ${userInfo?.private?.privateInfo?.settings?.darkMode ? "text-white" : "text-black"}`}>{userInfo?.publicInfo?.name}</Text>
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
            <SettingsNavigationButton
                iconName='pencil-circle'
                mainText='Profile'
                subText='Photo, Display Name, etc..'
                darkMode={userInfo?.private?.privateInfo?.settings?.darkMode}
                onPress={() => navigation.navigate("ProfileSettingsScreen")}
            />
            <SettingsNavigationButton
                iconName='brightness-6'
                mainText='Display'
                subText='Dark/Light theme'
                darkMode={userInfo?.private?.privateInfo?.settings?.darkMode}
                onPress={() => navigation.navigate("DisplaySettingsScreen")}
            />
            <SettingsNavigationButton
                iconName='account-box'
                mainText='Account'
                subText='Email, Password..'
                darkMode={userInfo?.private?.privateInfo?.settings?.darkMode}
                onPress={() => navigation.navigate("AccountSettingsScreen")}
            />
            <SettingsNavigationButton
                iconName='information-outline'
                mainText='About'
                subText='Information about the app'
                darkMode={userInfo?.private?.privateInfo?.settings?.darkMode}
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
    return (
        <ScrollView>

        </ScrollView>
    );
};

const DisplaySettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext) ?? {};
    const [loading, setLoading] = useState<boolean>(false);

    return (
        <ScrollView
            className={`flex-col ${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center',
                minHeight: '100%',
            }}
        >
            <SettingsToggleButton
                mainText='Dark theme'
                subText='Changes display of entire app'
                isInitiallyToggled={userInfo?.private?.privateInfo?.settings?.darkMode}
                darkMode={userInfo?.private?.privateInfo?.settings?.darkMode}
                onPress={async () => {
                    setLoading(true)
                    await setPrivateUserData({
                        settings: {
                            darkMode: !userInfo?.private?.privateInfo?.settings?.darkMode
                        }
                    })
                        .then(async () => {
                            if (auth.currentUser?.uid) {
                                const databaseUser = await getUser(auth.currentUser?.uid);
                                setUserInfo ? setUserInfo(databaseUser) : console.warn("setUserInfo is undefined");
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
    return (
        <ScrollView>

        </ScrollView>
    );
};

const AboutScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    return (
        <ScrollView>

        </ScrollView>
    );
};


export { SettingsScreen, SearchSettingsScreen, ProfileSettingsScreen, DisplaySettingsScreen, AccountSettingsScreen, AboutScreen };

