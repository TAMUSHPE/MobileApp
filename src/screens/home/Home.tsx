import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import Ishpe from './Ishpe';
import { Images } from '../../../assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../../context/UserContext';

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const Home = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer

    useEffect(() => {
        manageNotificationPermissions();
    }, []);

    return (
        <ScrollView className="flex flex-col bg-offwhite">
            <StatusBar style='dark' />
            {/* Header */}
            <SafeAreaView className='flex-1 bg-white' edges={["top"]}>
                <View className='flex-row px-5 pb-4'>
                    <View className='flex-1 justify-center items-start'>
                        <Image
                            className="h-10 w-52"
                            source={Images.LOGO_LIGHT}
                        />
                    </View>
                </View>
            </SafeAreaView>


            <FlickrPhotoGallery />

            {isSuperUser && (
                <TouchableOpacity
                    className='bg-pale-blue p-2 rounded-md m-2'
                    onPress={() => navigation.navigate("AdminDashboard")}
                >
                    <Text>Admin Dashboard</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                className='bg-pale-blue p-2 rounded-md m-2'
                onPress={() => navigation.navigate("MemberSHPE")}
            >
                <Text>MemberSHPE Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className='bg-pale-blue p-2 rounded-md m-2'
                onPress={() => navigation.navigate("Members")}
            >
                <Text>Member</Text>
            </TouchableOpacity>
            <Ishpe navigation={navigation} />

            {/* <FeaturedSlider route={route} /> */}

            <MOTMCard navigation={navigation} />

            <View className="mb-8" />
        </ScrollView>
    );
}

export default Home;