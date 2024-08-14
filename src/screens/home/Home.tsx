import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import manageNotificationPermissions from '../../helpers/pushNotification';
import { HomeStackParams } from "../../types/navigation"
import MOTMCard from '../../components/MOTMCard';
import FlickrPhotoGallery from '../../components/FlickrPhotoGallery';
import { Images } from '../../../assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../../context/UserContext';
import { isMemberVerified } from '../../helpers/membership';
import { auth, db } from '../../config/firebaseConfig';
import DismissibleModal from '../../components/DismissibleModal';
import { fetchOfficeCount, fetchOfficerStatus, getMyEvents, getUser, knockOnWall, setPublicUserData, updateOfficerStatus } from '../../api/firebaseUtils';
import { EventType, SHPEEvent } from '../../types/events';
import EventCard from '../events/EventCard';
import { reverseFormattedFirebaseName } from '../../types/committees';
import { doc, getDoc } from 'firebase/firestore';

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

    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

    const [isVerified, setIsVerified] = useState<boolean>(true); // By default hide "become a member" banner
    const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined);
    const [officeCount, setOfficeCount] = useState<number>(0);
    const [knockOnWallConfirmMenu, setKnockOnWallConfirmMenu] = useState<boolean>(false);
    const [officeHourInfoMenu, setOfficeHourInfoMenu] = useState<boolean>(false);
    const [signInConfirmMenu, setSignInConfirmMenu] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [userInterests, setUserInterests] = useState<string[]>(userInfo?.publicInfo?.interests || []);
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [myEvents, setMyEvents] = useState<SHPEEvent[]>([]);
    const [interestOptionsModal, setInterestOptionsModal] = useState<boolean>(false);
    const [savedInterestLoading, setSavedInterestLoading] = useState<boolean>(false);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);

            const events = await getMyEvents(userCommittees, userInterests, 3);
            events.sort((a, b) => (a.startTime?.toDate().getTime() || 0) - (b.startTime?.toDate().getTime() || 0));
            setMyEvents(events);
        } catch (error) {
            console.error("Error retrieving events:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserData = async () => {
        console.log("Fetching user data...");
        try {
            const firebaseUser = await getUser(auth.currentUser?.uid!)
            if (firebaseUser) {
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
            }
            else {
                console.warn("User data undefined. Data was likely deleted from Firebase.");
            }
            setUserInfo(firebaseUser);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    }

    useEffect(() => {
        manageNotificationPermissions();
    }, []);

    useEffect(() => {
        setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
    }, [nationalExpiration, chapterExpiration])

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            setCurrentUser(user);

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    signOutUser(true);
                } else {
                    fetchUserData();
                }
            }
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

        fetchEvents();
        getOfficeCount();
        if (hasPrivileges) {
            getOfficerStatus();
        }
    }, [currentUser]);

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
        setInterestOptionsModal(false);
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
                            className={`flex-1 flex-row justify-between items-center h-14 rounded-lg  ${officeCount > 0 ? "bg-primary-blue" : "bg-grey-dark"}`}
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
                                className={`h-full justify-center px-3 rounded-r-lg`}
                                style={{ backgroundColor: "rgba(256,256,256,0.4)" }}
                                onPress={() => setOfficeHourInfoMenu(!officeHourInfoMenu)}
                            >
                                <View>
                                    {officeHourInfoMenu && (
                                        <View className={`absolute rounded-md z-20 border w-44 right-0 top-12 px-3 py-2  ${darkMode ? "bg-secondary-bg-dark border-grey-dark" : "bg-secondary-bg-light border-grey-light"}`}
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
                <View className='mt-12 -z-10'>
                    <View className='flex-row mb-3'>
                        <View className='flex-row ml-4 flex-1'>
                            <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>My Events</Text>
                            <TouchableOpacity
                                className='px-4'
                                onPress={() => setInterestOptionsModal(true)}
                            >
                                <Octicons name="gear" size={24} color={darkMode ? "white" : "black"} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            className='px-4'
                            onPress={() => navigation.getParent()?.navigate('EventsTab', { screen: 'EventsScreen', params: { filter: 'myEvents' } })}
                        >
                            <Text className='text-lg text-primary-blue font-semibold'>View all</Text>
                        </TouchableOpacity>
                    </View>


                    {isLoading && (
                        <ActivityIndicator size="small" className='mt-8' />
                    )}
                    {!isLoading && myEvents.length === 0 && (
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
                            <Text className={`text-center text-xl ${darkMode ? "text-white" : "text-black"}`}>You don't have any events. Check back later or visit the events screen to explore more options.</Text>
                        </View>

                    )}
                    <View className='mx-4'>
                        {!isLoading && myEvents.map((event: SHPEEvent, index) => {
                            return (
                                <View key={index} className={`${index > 0 && "mt-6"}`}>
                                    <EventCard event={event} navigation={navigation} />
                                </View>
                            );
                        })}
                    </View>
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
                    <Octicons name="bell" size={24} color={darkMode ? "white" : "black"} />

                    <View className='flex items-center w-[80%] mt-4'>
                        <Text className={`text-center text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>Are you sure you want to notify the signed-in officers?</Text>

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
                    className={`flex opacity-100 rounded-md py-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
                    style={{ maxWidth: "95%" }}
                >
                    {/* Header */}
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center ml-3'>
                            {darkMode ? (
                                <Image
                                    resizeMode='cover'
                                    className="h-14 w-14"
                                    source={Images.SHPE_WHITE}
                                />
                            ) : (
                                <Image
                                    resizeMode='cover'
                                    className="h-14 w-14"
                                    source={Images.SHPE_NAVY}
                                />
                            )}
                            <Text className={`text-3xl font-bold ml-3 ${darkMode ? "text-white" : "text-black"}`}>My Events</Text>
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
                    <Text className={`mx-4 text-lg ${darkMode ? "text-white" : "text-black"}`}>You will receive notifications for events related
                        to your interests and committees</Text>

                    {/* Interest */}
                    <View className='mt-8 mx-4'>
                        <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Interest</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>Select the type of events you are interested in</Text>

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
                        <Text className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>Your Committees</Text>
                        <Text className={`text-lg ${darkMode ? "text-white" : "text-black"}`}>Visit committees tab to join or leave a committee</Text>

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