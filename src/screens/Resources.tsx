import { View, Image, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ResourceButton from '../components/ResourceButton';
import ResourcesSmallButton from '../components/ResourceSmallButton';
import { ResourcesStackParams } from '../types/Navigation';
import { Images } from '../../assets';

const Resources = ({ navigation }: { navigation: NativeStackNavigationProp<ResourcesStackParams> }) => {
    const buttonItems = [
        {
            title: "Points Leaderboard",
            screen: "PointsLeaderboard" as keyof ResourcesStackParams,
            image: Images.MEMBERSHPE,
            "bg-color": "#EF9260",
            "text-color": "black"   // Text Colors will only accept preset name
        },
        {
            title: "Test Bank",
            screen: "TestBank" as keyof ResourcesStackParams,
            image: Images.LDMAIN,
            "bg-color": "#C24E3A",
            "text-color": "white"
        },
        {
            title: "Resume Bank",
            screen: "ResumeBank" as keyof ResourcesStackParams,
            image: Images.EBOARD,
            "bg-color": "#001F5B",
            "text-color": "white"
        }
    ]

    const smallButtonItems = [
        {
            title: "TAMU SHPE Website",
            url: "https://www.tamushpe.org/",
            image: Images.TAMU_WHITE,
            "bg-color": "#500000",
            "text-color": "white"
        },
        {
            title: "Geneva Group",
            url: "https://www.geneva.com/",
            image: Images.GENEVA,
            "bg-color": "#A1CEFE",
            "text-color": "white"
        },
        {
            title: "Test",
            url: "https://shpe.org/",
            image: Images.SHPE_LOGO,
            "bg-color": "#191740",
            "text-color": "white"
        }
    ]
    return (
        <SafeAreaView
            className={`bg-offwhite`}
            edges={["top"]}
        >
            <ScrollView className='w-screen'>
                <View
                    className='justify-center items-start h-18 px-5 pb-2 pt-3'
                >
                    <Image
                        className="h-10 w-52"
                        source={Images.LOGO_LIGHT}
                    />
                </View>

                <View className='mt-4'>
                    <ResourceButton items={buttonItems[0]} navigation={navigation} />
                    <ResourceButton items={buttonItems[1]} navigation={navigation} />
                    <ResourceButton items={buttonItems[2]} navigation={navigation} />
                </View>
                <View className='mb-12 flex-row flex-wrap'>
                    <ResourcesSmallButton items={smallButtonItems[0]} />
                    <ResourcesSmallButton items={smallButtonItems[1]} />
                    <ResourcesSmallButton items={smallButtonItems[2]} />
                </View>
            </ScrollView>
        </SafeAreaView >

    )
}

export default Resources;
