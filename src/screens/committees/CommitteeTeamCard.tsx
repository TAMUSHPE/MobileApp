import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { CommitteesStackParams } from '../../types/navigation'
import { getBadgeColor, isMemberVerified } from '../../helpers/membership'
import { Images } from '../../../assets'
import TwitterSvg from '../../components/TwitterSvg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PublicUserInfo } from '../../types/user'
import { UserContext } from '../../context/UserContext'
import { useColorScheme } from 'react-native'

const CommitteeTeamCard: React.FC<CommitteeTeamCardProps> = ({ userData, navigation }) => {
    if (!userData || Object.keys(userData).length === 0) {
        return null;
    }

    const { name, roles, uid, photoURL, email, isEmailPublic } = userData

    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;
    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;


    const [isVerified, setIsVerified] = useState<boolean>(false);

    const handleCardPress = (uid: string): string | void => {
        navigation!.navigate("PublicProfile", { uid });
    };

    return (
        <TouchableOpacity
            onPress={() => (navigation && handleCardPress(uid!))}
            activeOpacity={!!handleCardPress && 1 || 0.6}
        >
            <View className="flex-row">
                <Image
                    className="flex w-12 h-12 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                />
                <View className='ml-2 my-1 items-center justify-center'>
                    <View>
                        <View className="flex-row items-center">
                            <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        </View>
                        {(isEmailPublic && email && email.trim() !== "") && (
                            <Text className={`text-md font-semibold ${darkMode ? "text-white" : "text-black"}`}>{email}</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

type CommitteeTeamCardProps = {
    userData: PublicUserInfo;
    navigation?: NativeStackNavigationProp<CommitteesStackParams>
}

export default CommitteeTeamCard