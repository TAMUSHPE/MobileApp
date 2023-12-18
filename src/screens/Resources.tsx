import { View, Image, ScrollView, Text, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourcesStackParams } from '../types/Navigation';
import { Images } from '../../assets';
import LeaderBoardIcon from '../../assets/ranking-star-solid.svg';
import ExamIcon from '../../assets/exam-icon.svg';
import ResumeIcon from '../../assets/resume-icon.svg';
import OfficeHours from '../components/OfficeHours';

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const insets = useSafeAreaInsets();
    const handleLinkPress = async (url: string) => {
        if (!url) {
            console.warn(`Empty/Falsy URL passed to handleLinkPress(): ${url}`);
            return;
        }

        await Linking.canOpenURL(url)
            .then(async (supported) => {
                if (supported) {
                    await Linking.openURL(url)
                        .catch((err) => console.error(`Issue opening url: ${err}`));
                } else {
                    console.warn(`Don't know how to open this URL: ${url}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <View style={{ paddingTop: insets.top }} className='flex-1 bg-white'>
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
                    <TouchableOpacity
                        className='flex-col items-center'
                        onPress={() => handleLinkPress('https://www.geneva.com/')}
                    >
                        <View className='h-14 w-14 rounded-full bg-[#A1CEFE] items-center justify-center'>
                            <Image source={Images.GENEVA} className='h-10 w-10 rounded-full' />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-col items-center'
                        onPress={() => handleLinkPress('https://www.instagram.com/tamushpe/')}
                    >
                        <View className='h-14 w-14 rounded-full items-center justify-center'>
                            <Image source={Images.INSTAGRAM} className='h-14 w-14' />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-col items-center'
                        onPress={() => handleLinkPress('https://www.flickr.com/photos/143848472@N03/albums/')}
                    >

                        <View className='h-14 w-14 rounded-full items-center justify-center'>
                            <Image source={Images.FLICKER} className='h-14 w-14' />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-col items-center'
                        onPress={() => handleLinkPress('https://www.tamushpe.org/')}
                    >
                        <View className='h-14 w-14 rounded-full bg-maroon items-center justify-center'>
                            <Image source={Images.TAMU_WHITE} className='h-12 w-12 rounded-full' />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-col items-center'
                        onPress={() => handleLinkPress('https://shpe.org/')}
                    >
                        <View className='h-14 w-14 rounded-full bg-dark-navy items-center justify-center'>
                            <Image source={Images.SHPE_LOGO} className='h-12 w-12 rounded-full' />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Resources */}
                <View className='flex-col mt-12 items-center space-y-8'>
                    <TouchableOpacity
                        className='flex-row bg-pale-blue w-[85%] h-24 rounded-3xl'
                        onPress={() => navigation.navigate("PointsLeaderboard")}
                    >
                        <View className='w-[73%] flex-row items-end px-6 py-3'>
                            <Text className='text-white font-bold text-2xl'>Points Leaderboard</Text>
                        </View>
                        <View className='flex-1 justify-center items-center rounded-r-3xl'
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                        >
                            <LeaderBoardIcon width={50} height={50} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-row bg-pale-blue w-[85%] h-24 rounded-3xl'
                        onPress={() => navigation.navigate("TestBank")}
                    >
                        <View className='w-[73%] flex-row items-end px-6 py-3'>
                            <Text className='text-white font-bold text-2xl'>Test Bank</Text>
                        </View>
                        <View className='flex-1 justify-center items-center rounded-r-3xl'
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                        >
                            <ExamIcon width={50} height={50} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className='flex-row bg-pale-blue w-[85%] h-24 rounded-3xl'
                        onPress={() => navigation.navigate("ResumeBank")}
                    >
                        <View className='w-[73%] flex-row items-end px-6 py-3'>
                            <Text className='text-white font-bold text-2xl'>Resume Bank</Text>
                        </View>
                        <View className='flex-1 justify-center items-center rounded-r-3xl'
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                        >
                            <ResumeIcon width={50} height={50} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Office Hours */}
                <OfficeHours />

                <View className='mb-12' />
            </ScrollView>
        </View>
    )
}

export default Resources;
