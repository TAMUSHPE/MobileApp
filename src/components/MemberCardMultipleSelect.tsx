import { Image, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import React, { useContext } from 'react'
import { Images } from '../../assets'
import { PublicUserInfo } from '../types/user'
import { UserContext } from '../context/UserContext'

const MemberCardMultipleSelect: React.FC<MemberCardMultipleSelectProp> = ({ userData, handleCardPress }) => {
    if (!userData) { return }
    const { name, roles, uid, displayName, photoURL, chapterExpiration, nationalExpiration, selected } = userData

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    return (
        <TouchableOpacity
            className='mb-8'
            onPress={() => handleCardPress && handleCardPress(uid!)}
            activeOpacity={0.6}
        >
            <View className="flex-row items-center ml-4">
                <View className={`h-7 w-7 mr-4 border-2 rounded-full items-center justify-center ${selected ? "border-primary-blue" : darkMode ? "border-grey-light" : "border-grey-dark"}`}>
                    <View className={`h-5 w-5 rounded-full ${selected && "bg-primary-blue"}`} />
                </View>

                <Image
                    className="flex w-12 h-12 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                />

                <View className='ml-2 my-1'>
                    <View>
                        <Text className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>{name}</Text>
                        <Text className={`text-md ${darkMode ? 'text-grey-light' : 'text-grey'}`}>{displayName}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

interface SelectedPublicUserInfo extends PublicUserInfo {
    selected?: boolean;
}

export type MemberCardMultipleSelectProp = {
    handleCardPress?: (uid: string | void) => void;
    userData?: SelectedPublicUserInfo;
}

export default MemberCardMultipleSelect