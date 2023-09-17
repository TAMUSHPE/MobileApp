import { Image, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { MembersProps } from '../types/Navigation'
import { Images } from '../../assets'
import { auth } from '../config/firebaseConfig'

const MemberCard: React.FC<MembersProps> = ({ userData, handleOnPress, navigation }) => {
    if (!userData) {
        return
    }
    const { name, classYear, committees, roles, uid, displayName, photoURL } = userData

    return (
        <TouchableOpacity className='mb-8'
            onPress={handleOnPress}
        >
            <View className="flex-row">

                <Image
                    className="flex w-12 h-12 rounded-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                />
                <View className='ml-2 my-1'>
                    <View>
                        <Text className='font-semibold text-lg'>{name} {classYear}</Text>
                        <Text className='text-md text-grey'> {displayName}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default MemberCard