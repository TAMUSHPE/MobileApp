import { View, Image, ScrollView, Text, TouchableOpacity, ImageSourcePropType } from 'react-native';
import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { handleLinkPress } from '../../helpers/links';
import { ResourcesStackParams } from '../../types/Navigation';
import { Images } from '../../../assets';
import LeaderBoardIcon from '../../../assets/ranking-star-solid.svg';
import ResumeIcon from '../../../assets/resume-icon.svg';
import ExamIcon from '../../../assets/exam-icon.svg';
import OfficeHours from './OfficeHours';

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
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
                <Image source={imageSource} className={bgColor != "" ? "w-11 h-11" : "w-14 h-14"} />
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
            onPress={() => navigation.navigate(navigateTo)}
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
                    <SocialMediaButton
                        url="https://www.geneva.com/"
                        imageSource={Images.GENEVA}
                        bgColor="bg-[#A1CEFE]"
                    />
                    <SocialMediaButton
                        url="https://www.instagram.com/tamushpe/"
                        imageSource={Images.INSTAGRAM}
                    />
                    <SocialMediaButton
                        url="https://www.flickr.com/photos/143848472@N03/albums/"
                        imageSource={Images.FLICKER}
                    />
                    <SocialMediaButton
                        url="https://www.tamushpe.org/"
                        imageSource={Images.TAMU_WHITE}
                        bgColor='bg-maroon'
                    />
                    <SocialMediaButton
                        url="https://shpe.org/"
                        imageSource={Images.SHPE_LOGO}
                        bgColor='bg-dark-navy'
                    />
                </View>

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
