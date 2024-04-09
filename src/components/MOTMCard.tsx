import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useCallback, useState } from 'react'
import { MemberCardProp } from '../types/Navigation'
import { Images } from '../../assets'
import { PublicUserInfo } from '../types/User'
import { getMOTM } from '../api/firebaseUtils'
import { useFocusEffect } from '@react-navigation/core'

const MOTMCard: React.FC<MemberCardProp> = ({ navigation }) => {
    const [MOTM, setMOTM] = useState<PublicUserInfo>();


    const fetchMOTM = async () => {
        try {
            const fetchedMOTM = await getMOTM();
            setMOTM(fetchedMOTM);
        } catch (error) {
            console.error('Error fetching member of the month:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMOTM();
        }, [])
    );

    return (
        <TouchableOpacity
            className='mx-4 mt-10'
            onPress={() => {
                navigation?.navigate("PublicProfile", { uid: MOTM?.uid });
            }}>
            <View className='flex-row'>
                <View>
                    <Image
                        className="flex w-32 h-32 rounded-xl"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={MOTM?.photoURL ? { uri: MOTM?.photoURL as string } : Images.DEFAULT_USER_PICTURE}
                    />
                </View>
                <View className='ml-3 flex-1 pr-2'>
                    <Text className='font-bold text-pale-blue text-2xl'>Member of the Month</Text>
                    <Text className='font-bold text-xl'>{MOTM?.name}</Text>
                    <Text className='font-semibold text-md mt-3'>{MOTM?.bio}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default MOTMCard