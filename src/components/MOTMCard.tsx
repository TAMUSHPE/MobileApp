import { View, Text, Image } from 'react-native'
import React from 'react'
import { MemberCardProp } from '../types/Navigation'
import { Images } from '../../assets'

const MOTMCard: React.FC<MemberCardProp> = ({ userData, handleCardPress, navigation }) => {
    return (
        <View className='mx-4'>
            <View className='flex-row'>
                <View>
                    <Image
                        className="flex w-32 h-32 rounded-xl"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={userData?.photoURL ? { uri: userData?.photoURL as string } : Images.DEFAULT_USER_PICTURE}
                    />
                </View>
                <View className='ml-3 flex-1 pr-2'>
                    <Text className='font-bold text-pale-blue text-2xl'>Member of the Month</Text>
                    <Text className='font-bold text-xl'>{userData?.name}</Text>
                    <Text className='font-semibold text-md mt-3'>{userData?.bio}</Text>
                </View>
            </View>
        </View>
    )
}

export default MOTMCard