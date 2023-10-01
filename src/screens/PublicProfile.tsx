import { View, Text, ActivityIndicator, Image, TouchableHighlight } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { getPublicUserData } from '../api/firebaseUtils';
import { MembersScreenRouteProp, MembersStackParams } from '../types/Navigation';
import { PublicUserInfo } from '../types/User';
import { Images } from '../../assets';
import { Octicons } from '@expo/vector-icons';
import ProfileBadge from '../components/ProfileBadge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommitteeConstants, CommitteeKey } from '../types/Committees';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const PublicProfileScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;
    const [publicUserData, setPublicUserData] = useState<PublicUserInfo | undefined>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPublicUserData = async () => {
            await getPublicUserData(uid)
                .then((res) => {
                    setPublicUserData(res);
                })
                .catch((error) => console.error("Failed to fetch public user data:", error))
                .finally(() => {
                    setLoading(false);
                });

        };
        fetchPublicUserData();
    }, [auth]);

    if (loading) {
        return (
            <View className='fixed top-1/2 -translate-y-1/2 '>
                <ActivityIndicator
                    size="large"
                    animating={true}
                    color="rgba(137,232,207,100)"
                />
            </View>
        );
    }

    return (
        <SafeAreaView className='h-full' edges={['right', 'top', 'left']}>
            <View className='fixed top-0 left-6 right-0'>
                <TouchableHighlight onPress={() => navigation.goBack()} underlayColor="offwhite">
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableHighlight>
            </View>
            <View className="items-center justify-center flex-1 space-y-8">
                <View className='flex items-center justify-center'>
                    <Image
                        className="flex w-28 h-28 rounded-full"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={publicUserData?.photoURL ? { uri: publicUserData?.photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='flex-row items-center justify-start'>
                        <Text className='text-2xl font-bold'> {publicUserData?.name} </Text>
                        <View className='rounded-full w-2 h-2 bg-orange ml-1' />
                        <Text className='font-bold'> {`${publicUserData?.points?.toFixed(2)} pts`} </Text>
                    </View>
                    <Text className='text-gray-500'> {publicUserData?.email} </Text>
                </View>
                <View className='bg-white w-4/5 rounded-xl items-center pt-3 pb-7 px-7 space-y-1 shadow-md shadow-black'>
                    <Text className='text-xl font-bold'> {`${publicUserData?.major} ${publicUserData?.classYear}`} </Text>
                    <Text className=''> {`${publicUserData?.bio}`} </Text>
                </View>
                <View className='bg-white w-4/5 rounded-xl pt-3 pb-12 px-2 space-y-2 shadow-md shadow-black items-center'>
                    <Text className='text-xl font-bold'> Committees </Text>
                    <View className='flex-row flex-wrap'>
                        {publicUserData?.committees?.map((key: string) => {
                            const committeeInfo = CommitteeConstants[key as CommitteeKey];
                            if (committeeInfo) {
                                return (
                                    <ProfileBadge
                                        key={key}
                                        text={committeeInfo.name}
                                        badgeColor={committeeInfo ? committeeInfo?.color : ""}
                                        textClassName='text-center text-xs'
                                    />
                                );
                            }
                        })}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default PublicProfileScreen;