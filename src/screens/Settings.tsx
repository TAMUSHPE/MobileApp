import { View, Text, SafeAreaView, Image } from 'react-native';
import React, { useContext } from 'react';
import { SettingsStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const SettingsScreen = ({ navigation }: NativeStackScreenProps<SettingsStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext) ?? {};
    if (!setUserInfo) {
        return null;
    }

    const updateUserInfo = () => {
        /** Stubbed */
    }

    return (
        <SafeAreaView className='flex-1 items-center py-10'>
            <Image
                className='w-32 h-32 rounded-full'
                defaultSource={Images.DEFAULT_USER_PICTURE}
                source={auth?.currentUser?.photoURL ? { uri: auth?.currentUser?.photoURL } : Images.DEFAULT_USER_PICTURE}
            />
            <View className={`w-10/12 h-auto rounded-md border ${""}`}>
                <View>
                    <Text className='text-xl'>1234</Text>
                </View>
            </View>
            <Text className="text-4xl font-bold text-center">Settings Page w/ Param</Text>
        </SafeAreaView>
    )
}

export default SettingsScreen;

