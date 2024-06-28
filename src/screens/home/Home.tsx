import { Image, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import Ishpe from './Ishpe';
import { Images } from '../../../assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../../context/UserContext';
import { isMemberVerified } from '../../helpers/membership';
import { auth } from '../../config/firebaseConfig';
import DismissibleModal from '../../components/DismissibleModal';
import { fetchOfficeCount, fetchOfficerStatus, getUser, knockOnWall, updateOfficerStatus } from '../../api/firebaseUtils';

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const Home = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;
    const nationalExpiration = userInfo?.publicInfo?.nationalExpiration;
    const chapterExpiration = userInfo?.publicInfo?.chapterExpiration

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const [isVerified, setIsVerified] = useState<boolean>(true); // By default hide "become a member" banner
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
    const [officeCount, setOfficeCount] = useState<number>(0);
    const [knockOnWallConfirmMenu, setKnockOnWallConfirmMenu] = useState<boolean>(false);
    const [officeHourInfoMenu, setOfficeHourInfoMenu] = useState<boolean>(false);
    const [signInConfirmMenu, setSignInConfirmMenu] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);


    useEffect(() => {
        manageNotificationPermissions();
    }, []);

    useEffect(() => {
        setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
    }, [nationalExpiration, chapterExpiration])

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const getOfficeCount = async () => {
            const count = await fetchOfficeCount();
            setOfficeCount(count);
        };

        const getOfficerStatus = async () => {
            try {
                const status = await fetchOfficerStatus(currentUser.uid);
                setIsSignedIn(status?.signedIn || false);
            } catch (err) {
                console.error("Failed to fetch officer status:", err);
            }
        };

        getOfficeCount();
        if (hasPrivileges) {
            getOfficerStatus();
        }

    }, [currentUser]);

    return (
        <SafeAreaView edges={["top"]} className={`h-full ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"}`}>
            <StatusBar style={darkMode ? "light" : "dark"} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className='flex-row items-center justify-between'>
                    <View className='ml-4'>
                        <Image
                            resizeMode='contain'
                            className="h-12 w-36"
                            source={darkMode ? Images.SHPE_WHITE_HEADER : Images.SHPE_NAVY_HEADER}
                        />
                    </View>
                    <TouchableOpacity
                        className='px-6'
                        onPress={() => navigation.navigate("SettingsScreen")}
                    >
                        <Octicons name="gear" size={24} color={darkMode ? "white" : "black"} />
                    </TouchableOpacity>
                </View>

                {/* Flickr Slides */}
                <FlickrPhotoGallery />

                {/* MemberSHPE Apply */}
                {!isVerified && (
                    <TouchableOpacity
                        className='flex-row bg-primary-orange items-center justify-center mx-4 mt-4 rounded-2xl py-3 px-4 relative'
                        onPress={() => navigation.navigate("MemberSHPE")}
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
                    >
                        <Image
                            resizeMode='contain'
                            className="h-16 w-16 absolute left-7"
                            source={Images.SHPE_WHITE}
                        />
                        <Text className='text-2xl font-bold text-white mx-auto'>Become a Member</Text>
                    </TouchableOpacity>
                )}

                {/* Office Dashboard Office Sign In*/}
                {hasPrivileges && (
                    <View className="flex-row flex-1 items-center mx-4 mt-4 space-x-4">
                        <View className='flex-1'>
                            <TouchableOpacity
                                className='flex-1 items-center justify-center h-14 rounded-lg bg-dark-navy'
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
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate("AdminDashboard")}
                            >
                                <Text className={`text-xl text-white font-medium`}>Officer Dashboard</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='flex-1'>
                            <TouchableOpacity
                                className='flex-1 items-center justify-center h-14 rounded-lg bg-dark-navy'
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
                                activeOpacity={0.7}
                                onPress={() => setSignInConfirmMenu(!signInConfirmMenu)}
                            >
                                <Text className={`text-xl text-white font-medium`}>{isSignedIn ? "Office Sign Out" : "Office Sign In"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Member Directory and Knock On Wall*/}
                <View className="flex-row flex-1 items-center mx-4 mt-4 space-x-4">
                    <View className='flex-1'>
                        <TouchableOpacity
                            className='flex-1 items-center justify-center h-14 rounded-lg bg-primary-blue'
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
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Members")}
                        >
                            <Text className={`text-xl text-white font-medium`}>Member Directory</Text>
                        </TouchableOpacity>
                    </View>

                    <View className='flex-1'>
                        <TouchableOpacity
                            onPress={() => {
                                if (userInfo?.publicInfo?.isStudent && officeCount > 0) {
                                    setKnockOnWallConfirmMenu(!knockOnWallConfirmMenu)
                                } else {
                                    alert("You must be a student to knock on the wall.")
                                }
                            }}
                            className={`flex-1 flex-row justify-between items-center h-14 rounded-lg  ${officeCount > 0 ? "bg-primary-blue" : (darkMode ? "bg-grey-light" : "bg-grey-dark")}`}
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
                            activeOpacity={0.7}
                            disabled={officeCount === 0}
                        >
                            <Text className={`text-xl text-white font-medium flex-1 text-center`}>{officeCount > 0 ? "Knock on wall" : "Unavailable"}</Text>
                            <TouchableOpacity
                                className="border-l h-full justify-center px-3 border-white"
                                style={{ backgroundColor: "rgba(256,256,256,0.4)" }}
                                onPress={() => setOfficeHourInfoMenu(!officeHourInfoMenu)}
                            >
                                <View>
                                    {officeHourInfoMenu && (
                                        <View className={`absolute rounded-md z-20 border w-44 right-0 top-12 px-4 py-2  ${darkMode ? "bg-secondary-bg-dark border-grey-dark" : "bg-secondary-bg-light border-grey-light"}`}
                                        >
                                            <Text className={`text-xl font-medium ${darkMode ? "text-white" : "text-black"}`}>Notify an officer in Zach 450 for assistance.</Text>
                                        </View>

                                    )}
                                    <Octicons name="info" size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Events */}
                <Ishpe navigation={navigation} />
                {/* MOTM */}
                <MOTMCard navigation={navigation} />
            </ScrollView>

            {officeHourInfoMenu && (
                <TouchableOpacity className='flex-1 h-screen w-screen absolute'
                    onPress={() => setOfficeHourInfoMenu(false)}
                />
            )}

            <DismissibleModal
                visible={knockOnWallConfirmMenu}
                setVisible={setKnockOnWallConfirmMenu}
            >
                <View className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                    <Octicons name="bell" size={24} color={darkMode ? "white" : "dark"} />

                    <View className='flex items-center w-[80%] mt-4'>
                        <Text className={`text-center text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Are you sure you want to notify the signed-in officers?</Text>

                        <View className="flex-row mt-8">
                            <TouchableOpacity
                                onPress={async () => {
                                    setKnockOnWallConfirmMenu(false)
                                }}
                                className='flex-1'
                            >
                                <Text className='text-xl font-bold py-3 px-8'>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    setKnockOnWallConfirmMenu(false)
                                    knockOnWall(auth.currentUser?.uid!, userInfo?.publicInfo!)
                                    alert("You have notified the officers.")
                                }}
                                className="flex-1 bg-primary-blue rounded-xl justify-center items-center"
                            >
                                <Text className='text-xl font-bold text-white px-8'>Notify</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </DismissibleModal>


            <DismissibleModal
                visible={signInConfirmMenu}
                setVisible={setSignInConfirmMenu}
            >
                <View className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}>
                    <Octicons name="bell" size={24} color={darkMode ? "white" : "dark"} />

                    <View className='flex items-center w-[80%] mt-4'>
                        <Text className={`text-center text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>{isSignedIn ? "Are you sure you want to sign out?" : "You will receive notifications from members. Are you sure you want to sign in?"}</Text>

                        <View className="flex-row mt-8">
                            <TouchableOpacity
                                onPress={async () => {
                                    setKnockOnWallConfirmMenu(false)
                                }}
                                className='flex-1'
                            >
                                <Text className='text-xl font-bold py-3 px-8'>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={async () => {
                                    setSignInConfirmMenu(false)
                                    await updateOfficerStatus(auth.currentUser?.uid!, !isSignedIn);
                                    setIsSignedIn(!isSignedIn);
                                    setOfficeCount(isSignedIn ? officeCount - 1 : officeCount + 1);
                                }}
                                className="flex-1 bg-primary-blue rounded-xl justify-center items-center"
                            >
                                <Text className='text-xl font-bold text-white px-8'>{isSignedIn ? "Sign Out" : "Sign In"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </DismissibleModal>
        </SafeAreaView>
    );
}

export default Home;