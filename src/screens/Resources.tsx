import { View, Text, SafeAreaView, Image } from 'react-native';
import React from 'react';
import { Images } from '../../assets';
import ResourceItem from '../components/ResourceItem';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourcesStackNavigatorParams } from '../types/Navigation';

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackNavigatorParams> }) => {
    return (
        <SafeAreaView className="bg-offwhite h-18 shadow-black drop-shadow-lg px-5 pb-2 pt-3">
            <View
                className='justify-center items-start'
            >
                <Image
                    className="h-10 w-52"
                    source={Images.LOGO_LIGHT}
                />
            </View>
            <View className=''>
                <ResourceItem title='Points Leaderboard' image={Images.CAROUSEL_2} screen='PointsLeaderboard' navigation={navigation} />
                <ResourceItem title='Test Bank' image={Images.CAROUSEL_2} screen='TestBank' navigation={navigation} />
                {/* <ResourceItem title='Resume Bank' image={Images.CAROUSEL_2} screen='ResumeBank' navigation={navigation} /> */}
            </View>
        </SafeAreaView >

    )
}

export default Resources;
