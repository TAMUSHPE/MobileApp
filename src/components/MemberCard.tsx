import { Image, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { MemberCardProp } from '../types/navigation'
import { Images } from '../../assets'
import { UserContext } from '../context/UserContext'

const MemberCard: React.FC<MemberCardProp> = ({ userData, handleCardPress, navigation, displayPoints }) => {
    if (!userData) { return }
    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const { name, uid, displayName, photoURL, pointsThisMonth } = userData

    return (
        <TouchableOpacity
            className='mb-8'
            onPress={() => {
                if (navigation) {
                    navigation.navigate("PublicProfile", { uid });
                    return;
                }

                if (handleCardPress) {
                    handleCardPress(uid!);
                }
            }}
            activeOpacity={!!handleCardPress ? 1 : 0.6}
        >
            <View className="flex-row">
                <Image
                    className="flex w-12 h-12 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                />
                <View className='ml-2 my-1'>
                    <View>
                        <Text className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>{name}</Text>

                        <Text className={`text-md ${darkMode ? 'text-grey-light' : 'text-grey'}`}>{displayName}</Text>
                        {displayPoints && pointsThisMonth?.valueOf && (
                            <Text className={darkMode ? 'text-white' : 'text-black'}>{parseFloat(pointsThisMonth.toFixed(3))} pts</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default MemberCard