import { View, Text, SafeAreaView, Image } from 'react-native';
import React from 'react';
import { Images } from '../../assets';
import ResourceButton from '../components/ResourceButton';
import ResourcesSmallButton from '../components/ResourceSmallButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourcesStackNavigatorParams } from '../types/Navigation';


const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackNavigatorParams> }) => {
    const items = [
        {
            title: "Points Leaderboard",
            screen: "PointsLeaderboard" as keyof ResourcesStackNavigatorParams,
            image: Images.MEMBERSHPE,
            "bg-color": "#EF9260",
            "text-color": "black"
        },
        {
            title: "Test Bank",
            screen: "TestBank" as keyof ResourcesStackNavigatorParams,
            image: Images.LDMAIN,
            "bg-color": "#C24E3A",
            "text-color": "white"
        },
        {
            title: "Resume Bank",
            screen: "ResumeBank" as keyof ResourcesStackNavigatorParams,
            image: Images.EBOARD,
            "bg-color": "#001F5B",
            "text-color": "white"
        }
    ]
    return (
        <SafeAreaView className="bg-offwhite">
            <View
                className='justify-center items-start h-18 px-5 pb-2 pt-3'
            >
                <Image
                    className="h-10 w-52"
                    source={Images.LOGO_LIGHT}
                />
            </View>

            <View className='mt-4'>
                <ResourceButton items={items[0]} navigation={navigation} />
                <ResourceButton items={items[1]} navigation={navigation} />
                <ResourceButton items={items[2]} navigation={navigation} />
            </View>
            <View>
                <ResourcesSmallButton />
            </View>
        </SafeAreaView >

    )
}

export default Resources;
