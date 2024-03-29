import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { MemberCardProp } from '../types/Navigation'
import { Images } from '../../assets'
import TwitterSvg from './TwitterSvg'
import { getBadgeColor, isMemberVerified } from '../helpers/membership'

const MemberCard: React.FC<MemberCardProp> = ({ userData, handleCardPress, navigation }) => {
    if (!userData) { return }

    const { name, roles, uid, displayName, photoURL, chapterExpiration, nationalExpiration } = userData
    const isOfficer = roles ? roles.officer : false;

    const [isVerified, setIsVerified] = useState<boolean>(false);
    let badgeColor = getBadgeColor(isOfficer!, isVerified);

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

    return (
        <TouchableOpacity
            className='mb-8'
            onPress={() => handleCardPress && handleCardPress(uid!)}
            activeOpacity={!!handleCardPress && 1 || 0.6}
        >
            <View className="flex-row">
                <Image
                    className="flex w-12 h-12 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                />
                <View className='ml-2 my-1'>
                    <View>
                        <View className="flex-row items-center">
                            <Text className='font-semibold text-lg'>{name}</Text>
                            {(isOfficer || isVerified) && <TwitterSvg color={badgeColor} className="ml-2" />}
                        </View>
                        <Text className='text-md text-grey'> {displayName}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default MemberCard