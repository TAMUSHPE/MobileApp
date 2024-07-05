import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native'
import React, { useContext } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserContext } from '../../context/UserContext';
import { Images } from '../../../assets';
import { PublicUserInfo } from '../../types/user';
import { ResourcesStackParams } from '../../types/navigation';

/**
 * The RankCard component displays a user's rank information.
 * It provides an interactive card that navigates to the user's public profile.
 * 
 * @param props - Contains user public info data and navigation functions.
 */
const RankCard: React.FC<PointsProps> = ({ userData, navigation, rank, monthlyPoints }) => {
    const { uid, photoURL, name, points, pointsRank } = userData;

    const userContext = useContext(UserContext);
    const { userInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    return (
        <TouchableOpacity
            disabled={uid === undefined}
            onPress={() => { navigation.navigate("PublicProfile", { uid: uid! }) }}
        >
            <View
                className={`flex-row py-3 mx-4 px-4 mt-8 rounded-xl items-center ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                style={{
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}
            >
                <View className='flex-row'>
                    <Text className={`text-xl font-medium mr-5 ${darkMode ? "text-white" : "text-black"}`}>{rank}</Text>
                </View>

                <View className='flex-1 flex-row items-center'>
                    <Image
                        className="flex w-14 h-14 rounded-full mr-4"
                        source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='w-[65%]'>
                        <Text className={`text-xl font-medium ${darkMode ? "text-white" : "text-black"}`}>{name}</Text>
                        <View className='flex-row items-center'>
                            <Text className={`text-xl font-medium ${darkMode ? "text-grey-light" : "text-grey-dark"}`}>
                                {monthlyPoints !== undefined ? `${monthlyPoints.toFixed(2)} pts` : `${points?.toFixed(2)} pts`}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity >
    );
}

export type PointsProps = {
    userData: PublicUserInfo;
    navigation: NativeStackNavigationProp<ResourcesStackParams>;
    rank: number;
    monthlyPoints?: number;
}


export default RankCard