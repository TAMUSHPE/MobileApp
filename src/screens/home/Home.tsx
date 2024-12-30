import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Octicons, FontAwesome6, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import { Images } from '../../../assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../../context/UserContext';
import { isMemberVerified } from '../../helpers/membership';
import { auth } from '../../config/firebaseConfig';
import DismissibleModal from '../../components/DismissibleModal';
import { fetchLatestVersion, fetchOfficeCount, fetchOfficerStatus, getMyEvents, getUser, knockOnWall, setPublicUserData, updateOfficerStatus } from '../../api/firebaseUtils';
import { EventType, SHPEEvent } from '../../types/events';
import EventCard from '../events/EventCard';
import { reverseFormattedFirebaseName } from '../../types/committees';
import { useFocusEffect } from '@react-navigation/core';
import { compareVersions } from 'compare-versions';
import { incrementAppLaunchCount, requestReview } from '../../helpers/appReview';
const pkg = require("../../../package.json");

/**
 * Renders the home screen of the application.
 * It includes the feature slider, office hours, and office sign-in components.
 * It also manages the user's local and context state.
 *
 * @returns The rendered home screen.
 */
const Home = ({ navigation, route }: NativeStackScreenProps<HomeStackParams>) => {
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo, signOutUser } = userContext!;
    const nationalExpiration = userInfo?.publicInfo?.nationalExpiration;
    const chapterExpiration = userInfo?.publicInfo?.chapterExpiration
    const userCommittees = userInfo?.publicInfo?.committees || [];

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf() || userInfo?.publicInfo?.roles?.lead?.valueOf() || userInfo?.publicInfo?.roles?.representative?.valueOf());

    const [isVerified, setIsVerified] = useState<boolean>(true); // By default hide "become a member" banner
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
    const [officeCount, setOfficeCount] = useState<number>(0);
    const [knockOnWallConfirmMenu, setKnockOnWallConfirmMenu] = useState<boolean>(false);
    const [officeHourInfoMenu, setOfficeHourInfoMenu] = useState<boolean>(false);
    const [signInConfirmMenu, setSignInConfirmMenu] = useState<boolean>(false);
    const [userInterests, setUserInterests] = useState<string[]>(userInfo?.publicInfo?.interests || []);
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [myEvents, setMyEvents] = useState<SHPEEvent[]>([]);
    const [interestOptionsModal, setInterestOptionsModal] = useState<boolean>(false);
    const [savedInterestLoading, setSavedInterestLoading] = useState<boolean>(false);


    const showUpdateAlert = () => {
        Alert.alert(
            "Update Available",
            "A new version of the app is available. Please update to continue.",
            [
                {
                    text: "Update Now",
                    onPress: () => {
                        const appStoreLink = Platform.OS === "ios"
                            ? "https://apps.apple.com/us/app/tamu-shpe/id6451004230"
                            : "https://play.google.com/store/apps/details?id=com.tamu.shpe";
                        Linking.openURL(appStoreLink);
                    },
                },
                {
                    text: "Cancel",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    };


    const fetchEvents = async () => {
        try {
            setIsLoading(true);

            const events = await getMyEvents(userCommittees, userInterests, 4);
            events.sort((a, b) => (a.startTime?.toDate().getTime() || 0) - (b.startTime?.toDate().getTime() || 0));
            setMyEvents(events);
        } catch (error) {
            console.error("Error retrieving events:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        manageNotificationPermissions();
    }, []);

    useEffect(() => {
        setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
    }, [nationalExpiration, chapterExpiration])

    useEffect(() => {
        if (!auth.currentUser) return

        const getOfficeCount = async () => {
            const count = await fetchOfficeCount();
            setOfficeCount(count);
        };

        const getOfficerStatus = async () => {
            try {
                const status = await fetchOfficerStatus(auth.currentUser?.uid!);
                setIsSignedIn(status?.signedIn || false);
            } catch (err) {
                console.error("Failed to fetch officer status:", err);
            }
        };

        fetchEvents();
        getOfficeCount();
        if (hasPrivileges) {
            getOfficerStatus();
        }
    }, [auth.currentUser]);

    useEffect(() => {
        const checkForAppUpdate = async () => {
            const latestVersion = await fetchLatestVersion();
            const currentVersion = pkg.version.trim();

            if (latestVersion && compareVersions(currentVersion, latestVersion) < 0) {
                // Only show alert if the current version is older than the latest version
                showUpdateAlert();
            }
        };

        checkForAppUpdate();
    }, []);

    useEffect(() => {
        const checkForReview = async () => {
            await incrementAppLaunchCount();
            await requestReview();
        };

        checkForReview();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (hasPrivileges) {
                fetchEvents();
            }
        }, [hasPrivileges])
    );

    const isInterestChanged = () => {
        if (!userInfo?.publicInfo?.interests) {
            return userInterests.length > 0;
        }

        const originalInterests = new Set(userInfo.publicInfo.interests);
        const currentInterests = new Set(userInterests);

        if (originalInterests.size !== currentInterests.size) {
            return true;
        }

        for (let interest of originalInterests) {
            if (!currentInterests.has(interest)) {
                return true;
            }
        }

        return false;
    };

    const handleInterestToggle = (name: string) => {
        setUserInterests(prevInterest => {
            const interestedEvents = prevInterest.includes(name);
            if (interestedEvents) {
                return prevInterest.filter(interest => interest !== name);
            } else {
                return [...prevInterest, name];
            }
        });
    };

    const handleInterestUpdate = async () => {
        setSavedInterestLoading(true);
        await fetchEvents();

        await setPublicUserData({
            interests: userInterests,
        });

        // locally update user info
        if (userInfo) {
            const updatedUserInfo = {
                ...userInfo,
                publicInfo: {
                    ...userInfo.publicInfo,
                    interests: userInterests,
                },
            };

            try {
                await AsyncStorage.setItem("@user", JSON.stringify(updatedUserInfo));
                setUserInfo(updatedUserInfo);
            } catch (error) {
                console.error("Error updating user info:", error);
            }
        }

        setSavedInterestLoading(false);
    }

    const InterestButtons = ({ interestEvent, label }: {
        interestEvent: EventType;
        label: string;
    }) => {
        const isSelected = userInterests.includes(interestEvent);
        return (
            <TouchableOpacity
                onPress={() => handleInterestToggle(interestEvent)}
                className={`justify-center items-center flex-row border py-2 px-3 mr-6 mb-4 rounded-md ${isSelected ? "border-primary-blue bg-primary-blue" : (darkMode ? "bg-secondary-bg-dark border-white" : "bg-secondary-bg-light border-black")}`}
            >
                {isSelected ? (
                    <View className='mr-2'>
                        <Octicons name="check" size={20} color="white" />
                    </View>
                ) : (
                    <View className='mr-2'>
                        <Octicons name="check" size={20} color={"transparent"} />
                    </View>
                )}


                <Text className={`text-lg ${isSelected ? "text-white" : "text-transparent"} `}>{label}</Text>

                {!isSelected && (
                    <Text className={`text-lg ${darkMode ? "absolute text-white" : "absolute text-black"}`}>{label}</Text>
                )}
            </TouchableOpacity>
        );
    }

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
                        className='flex-row bg-primary-orange items-center justify-center mx-4 mt-4 rounded-2xl py-2 px-4 relative'
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
                            className="h-12 w-12 absolute left-0"
                            source={Images.SHPE_WHITE}
                        />
                        <Text className='text-xl font-bold text-white mx-auto'>Become a Member</Text>
                    </TouchableOpacity>
                )}

                {/* Office Dashboard Office Sign In*/}
                {hasPrivileges && (
                    <View className="flex-row flex-1 items-center mx-4 mt-4 space-x-4">
                        <View className='flex-1'>
                            <TouchableOpacity
                                className='flex-1 flex-row items-center justify-center py-2 rounded-lg bg-dark-navy'
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
                                <View className="absolute left-2">
                                    <FontAwesome name="star" color={"white"} size={25} />
                                </View>

                                <Text className={`text-xl text-white font-medium`}>Admin</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='flex-1'>
                            <TouchableOpacity
                                className='flex-1 flex-row items-center justify-center py-2 rounded-lg bg-dark-navy'
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
                                <View className="absolute left-2">
                                    <FontAwesome6 name="building" color={"white"} size={25} />
                                </View>

                                <Text className={`text-lg text-white font-medium`}>{isSignedIn ? "Sign Out" : "Sign In"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Member Directory, Knock On Wall, Merch*/}
                <View className='flex-row items-center justify-around mx-4 mt-4 flex-wrap'>
                    <TouchableOpacity
                        className={`items-center h-24 w-[25%] rounded-xl ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                        <View className='mt-4'>
                            <FontAwesome6 name="book" color={darkMode ? "white" : "black"} size={30} />
                        </View>
                        <View className='absolute bottom-2'>
                            <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Members</Text>
                        </View>

                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`items-center h-24 w-[25%] rounded-xl ${officeCount > 0
                            ? darkMode
                                ? "bg-secondary-bg-dark"
                                : "bg-secondary-bg-light"
                            : "bg-grey-dark opacity-60"
                            }`}
                        style={{
                            shadowColor: officeCount > 0 ? "#000" : "transparent",
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: officeCount > 0 ? 0.25 : 0,
                            shadowRadius: officeCount > 0 ? 3.84 : 0,
                            elevation: officeCount > 0 ? 5 : 0,
                        }}
                        activeOpacity={officeCount > 0 ? 0.7 : 1}
                        onPress={() => {
                            if (officeCount <= 0) {
                                Alert.alert("Knock On Wall", "There are no officers in the office at the moment.");
                            } else if (userInfo?.publicInfo?.isStudent) {
                                setKnockOnWallConfirmMenu(!knockOnWallConfirmMenu);
                            } else {
                                alert("You must be a student to knock on the wall.");
                            }
                        }}
                    >
                        <View className="mt-4">
                            <FontAwesome6
                                name="door-open"
                                color={darkMode ? "white" : "black"}
                                size={30}
                            />
                        </View>
                        <View className="absolute bottom-2">
                            <Text
                                className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}
                            >
                                K.O.W.
                            </Text>
                        </View>
                    </TouchableOpacity>


                    <TouchableOpacity
                        className={`items-center h-24 w-[25%] rounded-xl ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                        onPress={() => Alert.alert("Coming Soon", "This feature is coming soon.")}
                    >

                        <View className='mt-4'>
                            <FontAwesome6 name="bag-shopping" color={darkMode ? "white" : "black"} size={30} />
                        </View>
                        <View className='absolute bottom-2'>
                            <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Merch</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* My Events */}
                <View className='mt-10 -z-10'>
                    <View className='flex-row mb-3'>
                        <View className='flex-row ml-4 flex-1'>
                            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>My Events</Text>
                            <TouchableOpacity
                                className='px-4'
                                onPress={() => setInterestOptionsModal(true)}
                            >
                                <Octicons name="bell" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isLoading && (
                        <ActivityIndicator size="small" className='mt-8' />
                    )}

                    {!isLoading && (() => {
                        const visibleEvents = myEvents.filter(event => hasPrivileges || !event.hiddenEvent);

                        if (visibleEvents.length === 0) {
                            return (
                                <View
                                    className={`mx-4 mt-4 p-4 rounded-md flex-row ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                                    style={{
                                        shadowColor: "#000",
                                        shadowOffset: {
                                            width: 0,
                                            height: 2,
                                        },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 3.84,
                                        elevation: 5,
                                    }}>
                                    <Text className={`text-center text-xl ${darkMode ? "text-white" : "text-black"}`}>
                                        You don't have any events. Check back later or visit the events screen to explore more options.
                                    </Text>
                                </View>
                            );
                        }

                        return (
                            <View className='mx-4'>
                                {visibleEvents.map((event: SHPEEvent, index) => (
                                    <View key={index} className={`${index > 0 && "mt-6"}`}>
                                        <EventCard event={event} navigation={navigation} />
                                    </View>
                                ))}
                            </View>
                        );
                    })()}
                </View>


                {/* MOTM */}
                <View className='mt-10'>
                    <MOTMCard navigation={navigation} />
                </View>

                <View className='pb-16' />
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
                    <View className="flex-row items-center">
                        <Octicons name="bell" size={24} color={darkMode ? "white" : "black"} />
                        <Text className={`ml-2 text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Knock on Wall</Text>
                    </View>

                    <View className='flex items-center w-[80%] mt-4'>
                        <Text className={`text-center text-lg font-medium ${darkMode ? "text-white" : "text-black"}`}>
                            Notify officers in <Text className='text-primary-blue'>Zach 420</Text> to open the door. Be sure you are near the office.
                        </Text>


                        <View className="flex-row mt-8">
                            <TouchableOpacity
                                onPress={async () => {
                                    setKnockOnWallConfirmMenu(false)
                                }}
                                className='flex-1'
                            >
                                <Text className={`text-xl font-bold py-3 px-8 ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
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
                    <Octicons name="bell" size={24} color={darkMode ? "white" : "black"} />

                    <View className='flex items-center w-[80%] mt-4'>
                        <Text className={`text-center text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>{isSignedIn ? "Are you sure you want to sign out?" : "You will receive notifications from members. Are you sure you want to sign in?"}</Text>

                        <View className="flex-row mt-8">
                            <TouchableOpacity
                                onPress={async () => {
                                    setSignInConfirmMenu(false)
                                }}
                                className='flex-1'
                            >
                                <Text className={`text-xl font-bold py-3 px-8 ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
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

            <DismissibleModal
                visible={interestOptionsModal}
                setVisible={setInterestOptionsModal}
            >
                <View
                    className={`flex opacity-100 rounded-md py-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ maxWidth: "95%" }}
                >
                    {/* Header */}
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center ml-3'>
                            <Octicons name="bell" size={24} color={darkMode ? "white" : "black"} />
                            <Text className={`text-3xl font-bold ml-3 ${darkMode ? "text-white" : "text-black"}`}>Notifications</Text>
                        </View>
                        <View>
                            <TouchableOpacity
                                className='px-6'
                                onPress={() => {
                                    setInterestOptionsModal(false)
                                    setUserInterests(userInfo?.publicInfo?.interests || [])
                                }}>
                                <Octicons name="x" size={30} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Interest */}
                    <View className='mt-8 mx-4'>
                        <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Interest</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>Select the type of events you want notification for</Text>

                        {/* If any additional interest are added in the future, then update manually in profile setup */}
                        <View className='flex-row flex-wrap mt-6'>
                            <InterestButtons interestEvent={EventType.VOLUNTEER_EVENT} label="Volunteering" />
                            <InterestButtons interestEvent={EventType.INTRAMURAL_EVENT} label="Intramural" />
                            <InterestButtons interestEvent={EventType.SOCIAL_EVENT} label="Socials" />
                            <InterestButtons interestEvent={EventType.STUDY_HOURS} label="Study Hours" />
                            <InterestButtons interestEvent={EventType.WORKSHOP} label="Workshops" />
                        </View>

                        {/* Save Changes Button */}
                        <View>
                            <TouchableOpacity
                                className='w-full mt-4'
                                onPress={async () => { handleInterestUpdate() }}
                            >
                                <View className={`items-center justify-center w-full bg-primary-blue rounded-md px-2 py-2 ${isInterestChanged() ? "bg-primary-blue" : (darkMode ? "bg-grey-dark" : "bg-grey-light")}`}>
                                    {savedInterestLoading ? (
                                        <ActivityIndicator size="small" />
                                    ) : (
                                        <Text className='text-white font-bold text-xl'>Save</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Committees */}
                    <View className='mt-8 mx-4'>
                        <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Committees</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>You will be notified of your committee's event. Visit committees tab to join or leave a committee</Text>

                        {userCommittees && userCommittees.length > 0 && (
                            <View className='mt-2'>
                                <View className='flex-row flex-wrap mt-2'>
                                    {userCommittees?.map((committeeName, index) => {
                                        return (
                                            <View
                                                className={`border py-2 px-3 mr-2 mb-2 rounded-md border-primary-blue ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                                                key={index}
                                            >
                                                <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>{reverseFormattedFirebaseName(committeeName) || "Unknown"}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>

                    <View className='pb-10' />
                </View>
            </DismissibleModal>
        </SafeAreaView>
    );
}

export default Home;