import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Octicons } from '@expo/vector-icons';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import Ishpe from './Ishpe';
import { Images } from '../../../assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../../context/UserContext';
import OfficeHours from './OfficeHours';
import OfficeSignIn from './OfficeSignIn';

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
            <SafeAreaView className='bg-white' edges={["top"]}>
                <View className='mx-4 flex-1 flex-row mt-2 items-center'>
                    <View className='flex-1'>
                        <Image
                            resizeMode='contain'
                            className="h-11 w-36"
                            source={Images.SHPE_NAVY_HEADER}
                        />
                    </View>
                    <TouchableOpacity
                        className='px-2 py-2'
                        onPress={() => navigation.navigate("SettingsScreen")}
                    >
                        <Octicons name="gear" size={24} color="black" />
                    </TouchableOpacity>
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
            <MOTMCard navigation={navigation} />

            <OfficeHours />
            {userInfo?.publicInfo?.roles?.officer && <OfficeSignIn />}

            <View className="mb-8" />
        </ScrollView>
    );
}

export default Home;