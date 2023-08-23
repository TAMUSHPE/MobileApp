import { View, Text, Image, ScrollView, TextInput, TouchableHighlight, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useContext } from 'react';
import { SettingsStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons'

/**
 * 
 * @param iconName - Name of MaterialCommunityIcon to be used. Vector graphics can be found here: https://icons.expo.fyi/Index with the label "MaterialCommunityIcons"
 * @param mainText - The large text to be displayed on the button. This should be one or two words briefly explaining what the button does
 * @param mainText - The smaller text to be displayed on the button. This should add more details to what the button does
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
                    <Text className={"text-2xl"}>{mainText}</Text>
                    {subText && <Text className={`text-lg ${darkMode}`}>{subText}</Text>}
                </View>
            </View>
        </TouchableHighlight>
    );
};

const SettingsToggleButton = ({})

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
                    <Text className='text-4xl'>{userInfo?.publicInfo?.displayName}</Text>
                    <Text className='text-xl'>{userInfo?.publicInfo?.name}</Text>
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
    return (
        <ScrollView>

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

