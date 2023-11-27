import { Image, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { MembersProps } from '../types/Navigation'
import { Images } from '../../assets'
import { Octicons } from '@expo/vector-icons';

const MemberCard: React.FC<MembersProps> = ({ userData, handleCardPress, navigation }) => {
    if (!userData) {
        return
    }
    const { name, classYear, committees, roles, uid, displayName, photoURL, chapterVerification, nationalVerification } = userData
    const isOfficer = roles ? roles.officer : false;

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
                            <Text className='font-semibold text-lg'>{name} {classYear}</Text>
                            {isOfficer && (
                                <View className="ml-2">
                                    <Octicons name="star" size={15} color="gold" />
                                </View>

                            )}
                            {(!isOfficer && nationalVerification && chapterVerification) && (
                                <View className="ml-2">
                                    <Octicons name="check-circle" size={15} color="green" />
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