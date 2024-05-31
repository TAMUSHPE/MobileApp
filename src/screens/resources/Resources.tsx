import { View, Image, ScrollView, Text, TouchableOpacity, ImageSourcePropType, ActivityIndicator } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleLinkPress } from '../../helpers/links';
import { fetchLink, getUser } from '../../api/firebaseUtils';
import { auth } from '../../config/firebaseConfig';
import { ResourcesStackParams } from '../../types/navigation';
import { Images } from '../../../assets';
import LeaderBoardIcon from '../../../assets/ranking-star-solid.svg';
import ResumeIcon from '../../../assets/resume-icon.svg';
import ExamIcon from '../../../assets/exam-icon.svg';
import OfficeHours from './OfficeHours';
import { UserContext } from '../../context/UserContext';
import OfficeSignIn from './OfficeSignIn';
import { LinkData } from '../../types/links';


const linkIDs = ["1", "2", "3", "4", "5"]; // First 5 links are reserved for social media links


const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [links, setLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async () => {
        console.log("Fetching user data...");
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    const fetchLinks = async () => {
        const fetchedLinks = await Promise.all(
            linkIDs.map(async (id) => {
                const data = await fetchLink(id);
                return data || { id, name: '', url: '', imageUrl: null };
            })
        );
        setLinks(fetchedLinks);
        setLoading(false);
    };


    useEffect(() => {
        fetchUserData();
        fetchLinks();
    }, [])

    const SocialMediaButton = ({ url, imageSource, bgColor = "" }: {
        url: string,
        imageSource: ImageSourcePropType,
        bgColor?: string
    }) => (
        <TouchableOpacity
            className='flex-col items-center'
            onPress={() => handleLinkPress(url)}
        >
            <View className={`h-14 w-14 rounded-full items-center justify-center ${bgColor}`}>
                <Image source={imageSource} className="w-14 h-14 rounded-full" />
            </View>
        </TouchableOpacity>
    );

    const ResourceButton = ({ title, navigateTo, IconComponent }: {
        title: string;
        navigateTo: "PointsLeaderboard" | "TestBank" | "ResumeBank";
        IconComponent: React.ElementType;
    }) => (
        <TouchableOpacity
            className='flex-row bg-pale-blue w-[85%] h-24 rounded-3xl mb-8'
            onPress={() => {
                if (!userInfo?.publicInfo?.isStudent) {
                    alert("You must be a student to access this resource.");
                } else {
                    navigation.navigate(navigateTo);
                }
            }}
        >
            <View className='w-[73%] flex-row items-end px-6 py-3'>
                <Text className='text-white font-bold text-2xl'>{title}</Text>
            </View>
            <View className='flex-1 justify-center items-center rounded-r-3xl'
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
                <IconComponent width={50} height={50} />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <ActivityIndicator className='absolute top-0 bottom-0 left-0 right-0' size={100} />
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-white' edges={["top"]}>
            {/* Header */}
            <View className='flex-row px-5 pb-4'>
                <View className='flex-1 justify-center items-start'>
                    <Image
                        className="h-10 w-52"
                        source={Images.LOGO_LIGHT}
                    />
                </View>
            </View>

            <ScrollView >
                {/* Links */}
                <View className='flex-row mx-2 mt-4 justify-evenly'>
                    {links.map((link, index) => (
                        <SocialMediaButton
                            key={index}
                            url={link.url}
                            imageSource={{ uri: link.imageUrl || '' }}
                        />
                    ))}
                </View>

                {userInfo?.publicInfo?.roles?.officer && <OfficeSignIn />}

                {/* Resources */}
                <View className='flex-col mt-12 items-center'>
                    <ResourceButton
                        title="Points Leaderboard"
                        navigateTo="PointsLeaderboard"
                        IconComponent={LeaderBoardIcon}
                    />
                    <ResourceButton
                        title="Test Bank"
                        navigateTo="TestBank"
                        IconComponent={ExamIcon}
                    />
                    <ResourceButton
                        title="Resume Bank"
                        navigateTo="ResumeBank"
                        IconComponent={ResumeIcon}
                    />
                </View>

                <OfficeHours />

                <View className='mb-12' />
            </ScrollView>
        </SafeAreaView>
    )
}

export default Resources;
