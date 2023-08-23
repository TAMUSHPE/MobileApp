import { View, Text, Image, ScrollView, Button, TextInput } from 'react-native';
import React, { useContext } from 'react';
import { SettingsStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import InteractButton from '../components/InteractButton';

const SettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo } = useContext(UserContext) ?? {};

    const listItemClassName = `w-full py-4`;
    const listItemTextClassName = `text-2xl ${userInfo?.private?.privateInfo?.settings?.darkMode ? "text-white" : "text-black"}`;

    return (
        <ScrollView
            className={`flex-col ${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center'
            }}
        >
            <View className='w-full py-8 px-3 flex-row justify-end'>
                <Image
                    className='w-20 h-20 rounded-full'
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
                />
            </View>
            <View className={`w-full h-auto ${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
                <InteractButton
                    onPress={() => console.log("Button Pressed")}
                    label="Profile"
                    buttonClassName={listItemClassName}
                    textClassName={listItemTextClassName}
                />
                <InteractButton
                    onPress={() => console.log("Button Pressed")}
                    label="Display"
                    buttonClassName={listItemClassName}
                    textClassName={listItemTextClassName}
                />
                <InteractButton
                    onPress={() => console.log("Button Pressed")}
                    label="Profile Settings"
                    buttonClassName={listItemClassName}
                    textClassName={listItemTextClassName}
                />
                <InteractButton
                    onPress={() => console.log("Button Pressed")}
                    label="Profile Settings"
                    buttonClassName={listItemClassName}
                    textClassName={listItemTextClassName}
                />
            </View>
        </ScrollView>
    )
}

export default SettingsScreen;

