import { View, Text, Image, ScrollView, Button } from 'react-native';
import React, { useContext } from 'react';
import { SettingsStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import InteractButton from '../components/InteractButton';

const SettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext) ?? {};
    if (!setUserInfo) {
        return null;
    }


    return (
        <ScrollView
            className={`flex-col py-10 ${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}
            contentContainerStyle={{
                alignItems: 'center'
            }}
        >
            <Image
                className='w-32 h-32 rounded-full mb-10'
                defaultSource={Images.DEFAULT_USER_PICTURE}
                source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
            />
            <View className={`w-full h-auto border ${userInfo?.private?.privateInfo?.settings?.darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
                <InteractButton
                    onPress={() => console.log("Button Pressed")}
                    label="Profile Settings"
                    buttonClassName={``}
                    textClassName={`text-2xl ${userInfo?.private?.privateInfo?.settings?.darkMode ? "text-white" : "text-black"}`}
                />
            </View>
        </ScrollView>
    )
}

export default SettingsScreen;

