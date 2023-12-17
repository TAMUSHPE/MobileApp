import { Image, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { MembersProps } from '../types/Navigation'
import { Images } from '../../assets'
import TwitterSvg from './TwitterSvg'

const MemberCard: React.FC<MembersProps> = ({ userData, handleCardPress, navigation }) => {
    if (!userData) {
        return
    }
    const { name, roles, uid, displayName, photoURL, chapterExpiration, nationalExpiration } = userData
    const isOfficer = roles ? roles.officer : false;

    const [isVerified, setIsVerified] = useState<boolean>(false);


    useEffect(() => {
        const checkVerificationStatus = () => {
            if (!nationalExpiration || !chapterExpiration) {
                return;
            }
            const nationalExpirationString = nationalExpiration;
            const chapterExpirationString = chapterExpiration;

            const currentDate = new Date();
            let isNationalValid = true;
            let isChapterValid = true;

            if (nationalExpirationString) {
                const nationalExpirationDate = new Date(nationalExpirationString);
                isNationalValid = currentDate <= nationalExpirationDate;
            }

            if (chapterExpirationString) {
                const chapterExpirationDate = new Date(chapterExpirationString);
                isChapterValid = currentDate <= chapterExpirationDate;
            }

            setIsVerified(isNationalValid && isChapterValid);
        };

        checkVerificationStatus();
    }, [])

    return (
        <TouchableOpacity className='mb-8'
            onPress={() => handleCardPress(uid!)}
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
                            {isOfficer && (
                                <View className="ml-2">
                                    <TwitterSvg color="#FCE300" />
                                </View>

                            )}
                            {(!isOfficer && isVerified) && (
                                <View className="ml-2">
                                    <TwitterSvg color="#500000" />
                                </View>
                            )}
                        </View>
                        <Text className='text-md text-grey'> {displayName}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default MemberCard