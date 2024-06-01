import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { CommitteeTeamCardProps } from '../../types/navigation'
import { getBadgeColor, isMemberVerified } from '../../helpers/membership'
import { Images } from '../../../assets'
import TwitterSvg from '../../components/TwitterSvg'

const CommitteeTeamCard: React.FC<CommitteeTeamCardProps> = ({ userData, navigation }) => {
    if (!userData || Object.keys(userData).length === 0) {
        return null;
    }

    const { name, roles, uid, photoURL, chapterExpiration, nationalExpiration, email, isEmailPublic } = userData
    const isOfficer = roles ? roles.officer : false;
    const [isVerified, setIsVerified] = useState<boolean>(false);

    let badgeColor = getBadgeColor(isOfficer!, isVerified);

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

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
                <View className='ml-2 my-1'>
                    <View>
                        <View className="flex-row items-center">
                            <Text className='font-bold text-lg'>{name}</Text>
                            {(isOfficer || isVerified) && <TwitterSvg color={badgeColor} className="ml-2" />}
                        </View>
                        {(isEmailPublic && email && email.trim() !== "") && (
                            <Text className='text-md text-gray-500 font-semibold'>{email}</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default CommitteeTeamCard