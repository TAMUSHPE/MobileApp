import { View, Image, ScrollView, Text, TouchableOpacity, ImageSourcePropType, ActivityIndicator, useColorScheme, Animated } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../config/firebaseConfig';
import { fetchAndStoreUser, fetchLink } from '../../api/firebaseUtils';
import { UserContext } from '../../context/UserContext';
import { handleLinkPress } from '../../helpers/links';
import { ResourcesStackParams } from '../../types/navigation';
import { LinkData } from '../../types/links';
import LeaderBoardIcon from '../../../assets/ranking-star-solid.svg';
import ResumeIcon from '../../../assets/resume-icon.svg';
import ExamIcon from '../../../assets/exam-icon.svg';
import { isMemberVerified } from '../../helpers/membership';

const linkIDs = ["1", "2", "3", "4", "5"]; // First 5 links are reserved for social media links

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());


    const [isLoading, setIsLoading] = useState(true);
    const [links, setLinks] = useState<LinkData[]>([]);

    const fetchLinks = async () => {
        if (links.length > 0) return;
        const fetchedLinks = await Promise.all(
            linkIDs.map(async (id) => {
                const data = await fetchLink(id);
                return data || { id, name: '', url: '', imageUrl: null };
            })
        );
        setLinks(fetchedLinks);
        setIsLoading(false)
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const firebaseUser = await fetchAndStoreUser();
            if (firebaseUser) {
                setUserInfo(firebaseUser);
            }
        };


        fetchLinks();
        fetchUserData();
    }, [])

    const SocialMediaButton = ({ url, imageSource, bgColor = "", darkMode }: {
        url: string,
        imageSource: ImageSourcePropType,
        bgColor?: string,
        darkMode: boolean,
    }) => {
        const [isImageLoading, setIsImageLoading] = useState(true);
        const shimmerOpacity = useRef(new Animated.Value(0)).current;

        // Start shimmer animation
        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerOpacity, {
                        toValue: 1,
                        duration: 1500, // Slow down the animation
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerOpacity, {
                        toValue: 0,
                        duration: 1500, // Slow down the animation
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        return (
            <TouchableOpacity
                className="flex-col items-center"
                onPress={() => handleLinkPress(url)}
            >
                <View className={`h-14 w-14 rounded-full items-center justify-center ${bgColor}`}>
                    {isImageLoading && (
                        <View className="absolute w-14 h-14 bg-gray-300 rounded-full items-center justify-center overflow-hidden">
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    height: '100%',
                                    width: '100%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                    transform: [
                                        {
                                            translateY: shimmerOpacity.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-56, 56],
                                            }),
                                        },
                                    ],
                                }}
                            />
                        </View>
                    )}

                    <Image
                        source={imageSource}
                        className="w-14 h-14 rounded-full"
                        onLoadStart={() => setIsImageLoading(true)}
                        onLoad={() => setIsImageLoading(false)}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    const ResourceButton = ({ title, subTitle, navigateTo, IconComponent }: {
        title: string;
        subTitle: string;
        navigateTo: "PointsLeaderboard" | "TestBank" | "ResumeBank";
        IconComponent: React.ElementType;
    }) => (
        <TouchableOpacity
            className={`flex-row bg-primary-blue rounded-3xl mb-8 ${(userInfo?.publicInfo?.isStudent || navigateTo == "PointsLeaderboard") ? "bg-primary-blue" : (darkMode ? "bg-primary-grey-dark" : "bg-grey-light")}`}
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
                if (!userInfo?.publicInfo?.isStudent) {
                    alert("You must be a student of Texas A&M to access this resource")
                    return;
                }
                if (navigateTo == "PointsLeaderboard" || hasPrivileges || isMemberVerified(userInfo?.publicInfo?.nationalExpiration, userInfo?.publicInfo?.chapterExpiration)) {
                    navigation.navigate(navigateTo);
                } else {
                    alert("You must be a member of TAMU SHPE to access this resource. Visit the home screen to learn more to become a member!");
                }
            }}
        >
            <View className='w-[73%] px-6 my-4'>
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

                {isLoading ? (
                    <View className="flex-row mt-4 justify-evenly">
                        {Array(5)
                            .fill(null)
                            .map((_, index) => (
                                <View key={index} className="items-center">
                                    <View className={`w-14 h-14 rounded-full ${darkMode ? "bg-grey-dark" : "bg-grey-light"}`} />
                                </View>
                            ))}
                    </View>
                ) : (
                    <View className="flex-row mt-4 justify-evenly">
                        {links.map((link, index) => (
                            <SocialMediaButton
                                key={index}
                                url={link.url}
                                imageSource={{ uri: link.imageUrl || '' }}
                            />
                        ))}
                    </View>
                )}

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
