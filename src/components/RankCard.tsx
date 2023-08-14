import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { PointsProps } from '../types/Navigation'
import { Octicons } from '@expo/vector-icons';
import { Images } from '../../assets';

const RankCard: React.FC<PointsProps> = ({ userData, navigation }) => {

    const RenderIcon = () => {
        switch (userData.rankChange) {
            case "increased":
                return <Octicons name="chevron-up" size={24} color="#AEF359" />;
            case "decreased":
                return <Octicons name="chevron-down" size={24} color="#FF0000" />;
            default:
                return <Octicons name="dash" size={22} color="gray" />
        }
    };

    return (
        <TouchableOpacity onPress={() => {
            navigation.navigate("PublicProfile", { email: "jhernandez18@tamu.edu" });
        }}>
            <View className={`flex-row bg-[#D4D4D4] h-20 mx-4 px-4 mt-8 rounded-xl items-center`}>
                <View className='flex-1 flex-row items-center'>
                    <Image
                        className="flex w-14 h-14 rounded-full mr-4"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={userData.photoURL ? { uri: userData.photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='w-[65%]'>
                        <Text className='text-xl font-medium'>{userData.name}</Text>
                        <View className='flex-row items-center'>
                            <Octicons name="star-fill" size={24} color="black" />
                            <Text className='text-xl font-medium ml-2'>{userData.points} pts</Text>
                        </View>

                    </View>
                </View>
                <View className='flex-row'>
                    <Text className='text-xl font-medium mr-4'>{userData.pointsRank}</Text>
                    <View className='bg-white h-7 w-7 rounded-full items-center justify-center'>
                        <RenderIcon />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default RankCard