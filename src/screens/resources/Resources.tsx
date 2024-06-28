import { View, Image, ScrollView, Text, TouchableOpacity, ImageSourcePropType, ActivityIndicator, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../config/firebaseConfig';
import { fetchLink, getUser } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { handleLinkPress } from '../../helpers/links';
import { ResourcesStackParams } from '../../types/navigation';
import { LinkData } from '../../types/links';
import LeaderBoardIcon from '../../../assets/ranking-star-solid.svg';
import ResumeIcon from '../../../assets/resume-icon.svg';
import ExamIcon from '../../../assets/exam-icon.svg';

const linkIDs = ["1", "2", "3", "4", "5"]; // First 5 links are reserved for social media links

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [isLoading, setIsLoading] = useState(true);
    const [links, setLinks] = useState<LinkData[]>([]);

    const fetchLinks = async () => {
        const fetchedLinks = await Promise.all(
            linkIDs.map(async (id) => {
                const data = await fetchLink(id);
                return data || { id, name: '', url: '', imageUrl: null };
            })
        );
        setLinks(fetchedLinks);
        setIsLoading(false)
    };

    const fetchUserData = async () => {
        console.log("Fetching user data...");
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            if (firebaseUser) {
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            }
            else {
                console.warn("User data undefined. Data was likely deleted from Firebase.");
            }
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    useEffect(() => {
        fetchLinks();
        fetchUserData();
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

    const ResourceButton = ({ title, subTitle, navigateTo, IconComponent }: {
        title: string;
        subTitle: string;
        navigateTo: "PointsLeaderboard" | "TestBank" | "ResumeBank";
        IconComponent: React.ElementType;
    }) => (
        <TouchableOpacity
            className={`flex-row bg-primary-blue h-24 rounded-3xl mb-8 ${(userInfo?.publicInfo?.isStudent || navigateTo == "PointsLeaderboard") ? "bg-primary-blue" : (darkMode ? "bg-primary-grey-dark" : "bg-grey-light")}`}
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
            onPress={() => {
                if (userInfo?.publicInfo?.isStudent || navigateTo == "PointsLeaderboard") {
                    navigation.navigate(navigateTo);
                } else {
                    alert("You must be a student to access this resource.");
                }
            }}
        >
            <View className='w-[73%] px-6 mt-4'>
                <Text className='text-white font-bold text-2xl'>{title}</Text>

                <Text className='text-white text-lg'>{subTitle}</Text>
            </View>
            <View className='flex-1 justify-center items-center rounded-r-3xl'
                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
                <IconComponent width={50} height={50} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row px-4'>
                    <Text className={`text-4xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Resources</Text>
                </View>

                {isLoading &&
                    <View className='mt-10 justify-center items-center'>
                        <ActivityIndicator size="small" />
                    </View>
                }
                {/* Links */}
                <View className='flex-row mt-4 justify-evenly'>
                    {links.map((link, index) => (
                        <SocialMediaButton
                            key={index}
                            url={link.url}
                            imageSource={{ uri: link.imageUrl || '' }}
                        />
                    ))}
                </View>

                {/* Resources */}
                <View className='flex-col mt-14 items-center mx-4'>
                    <ResourceButton
                        title="Points Leaderboard"
                        subTitle="Track your points and see where you stand."
                        navigateTo="PointsLeaderboard"
                        IconComponent={LeaderBoardIcon}
                    />
                    <ResourceButton
                        title="Resume Bank"
                        subTitle='Upload and explore resumes for insight'
                        navigateTo="ResumeBank"
                        IconComponent={ResumeIcon}
                    />
                    <ResourceButton
                        title="Test Bank"
                        subTitle='Find past exams and study materials.'
                        navigateTo="TestBank"
                        IconComponent={ExamIcon}
                    />
                </View>
                <View className='pb-12' />
            </ScrollView>
        </SafeAreaView>
    )
}

export default Resources;
