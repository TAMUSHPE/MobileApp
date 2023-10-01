import { View, Text, ActivityIndicator, Image, TouchableHighlight } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { getPublicUserData } from '../api/firebaseUtils';
import { MembersProps, MembersScreenRouteProp } from '../types/Navigation';
import { Roles } from '../types/User';
import { Images } from '../../assets';
import { committeesList } from '../types/User';
import { Octicons } from '@expo/vector-icons';
import ProfileBadge from '../components/ProfileBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

const PublicProfileScreen = ({ navigation }: MembersProps) => {
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;

    const [points, setPoints] = useState<number>();
    const [name, setName] = useState<string>();
    const [loading, setLoading] = useState<boolean>(true);
    const [bio, setBio] = useState<string>();
    const [committees, setCommittees] = useState<string[]>();
    const [roles, setRoles] = useState<Roles>();
    const [classYear, setClassYear] = useState<string>();
    const [major, setMajor] = useState<string>();
    const [displayName, setDisplayName] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [photoURL, setPhotoURL] = useState<string>();
    const [pointsRank, setPointsRank] = useState<number | null>();



    useEffect(() => {
        const fetchPublicUserData = async () => {
            try {
                const publicUserData = await getPublicUserData(uid);
                setPoints(publicUserData?.points);
                setName(publicUserData?.name);
                setBio(publicUserData?.bio);
                setCommittees(publicUserData?.committees);
                setRoles(publicUserData?.roles);
                setClassYear(publicUserData?.classYear);
                setMajor(publicUserData?.major);
                setDisplayName(publicUserData?.displayName);
                setEmail(publicUserData?.email);
                setPhotoURL(publicUserData?.photoURL);
                setPointsRank(publicUserData?.pointsRank);
            } catch (error) {
                console.error("Failed to fetch public user data:", error);
            } finally {
                setLoading(false);
            }
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
                        source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='flex-row items-center justify-start'>
                        <Text className='text-2xl font-bold'> {`${name}`} </Text>
                        <View className='rounded-full w-2 h-2 bg-orange ml-1' />
                        <Text className='font-bold'> {`${points?.toFixed(2)} pts`} </Text>
                    </View>
                    <Text className='text-gray-500'> {email} </Text>
                </View>
                <View className='bg-white w-4/5 rounded-xl items-center pt-3 pb-7 px-7 space-y-1 shadow-md shadow-black'>
                    <Text className='text-xl font-bold'> {`${major} ${classYear}`} </Text>
                    <Text className=''> {`${bio}`} </Text>
                </View>
                <View className='bg-white w-4/5 rounded-xl pt-3 pb-12 px-2 space-y-2 shadow-md shadow-black items-center'>
                    <Text className='text-xl font-bold'> Committees </Text>
                    <View className='flex-row flex-wrap'>
                        {committees?.map((committeeName: string) => {
                            const committeeInfo = committeesList.find(element => element.name == committeeName);
                            return (
                                <ProfileBadge
                                    key={committeeName}
                                    text={committeeName}
                                    badgeColor={committeeInfo ? committeeInfo?.color : ""}
                                    textClassName='text-black text-center text-md'
                                />
                            );
                        })}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default PublicProfileScreen;