import { View, Image, ScrollView, Text, TouchableOpacity, ImageSourcePropType, ActivityIndicator, useColorScheme, Animated, Alert } from 'react-native';
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
import { Images } from '../../../assets';
import { hasPrivileges } from '../../helpers/rolesUtils';

const linkIDs = ["1", "2", "3", "4", "5","9"]; // First 5 links are reserved for social media links , 9 is Workshop drive

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const isAdmin = hasPrivileges(userInfo!, ['admin', 'officer', 'developer', 'representative', 'lead']);

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

    const SocialMediaButton = ({ url, imageSource, bgColor = "" }: {
        url: string,
        imageSource: ImageSourcePropType,
        bgColor?: string,
    }) => {
        const [isImageLoading, setIsImageLoading] = useState(true);
        const shimmerOpacity = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerOpacity, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerOpacity, {
                        toValue: 0,
                        duration: 1500,
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
            className={`flex-row bg-primary-blue rounded-3xl mb-8`}
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
                if (navigateTo == "PointsLeaderboard" || isAdmin || isMemberVerified(userInfo?.publicInfo?.nationalExpiration, userInfo?.publicInfo?.chapterExpiration)) {
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


                {/* General Resources */}
                <Text className={`text-3xl font-semibold mx-4 mb-2 mt-8 ${darkMode ? "text-white" : "text-black"}`}>General</Text>
                <View className='flex-col items-center mx-4'>
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

                {/* Internal Affairs Resources */}
                <Text className={`text-3xl font-semibold mx-4 mb-2 ${darkMode ? "text-white" : "text-black"}`}>Internal Affairs</Text>
                <View className='flex-col items-center mx-4'>
                    <TouchableOpacity
                        className="flex-row h-36 w-full rounded-3xl mb-8 shadow-lg"
                        activeOpacity={0.7}
                        onPress={() => {
                            Alert.alert("SHPE GAINS", "This feature is not yet available.");
                        }}
                    >
                        <Image
                            source={Images.SHPE_GAIN_COMING_SOON}
                            className="w-full h-full rounded-3xl"
                            resizeMode="cover"
                        />

                        <View className="absolute inset-0 h-full w-full rounded-3xl flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                        >
                            <Text className="opacity-80 text-white text-center font-bold text-5xl uppercase" style={{ fontFamily: 'BebasNeue' }}>Coming Soon</Text>
                        </View>
                    </TouchableOpacity>


                </View>
                <View className='pb-12' />
            </ScrollView>
        </SafeAreaView>
    )
}

export default Resources;
