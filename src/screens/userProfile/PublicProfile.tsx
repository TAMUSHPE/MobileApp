import { View, Text, ActivityIndicator, Image, Alert, TouchableOpacity, Pressable, TextInput, ScrollView, useColorScheme } from 'react-native';
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigationState } from '@react-navigation/core';;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { fetchAndStoreUser, getPublicUserData, getUser, getUserEventLogs, setUserRoles } from '../../api/firebaseUtils';
import { isMemberVerified } from '../../helpers/membership';
import { handleLinkPress } from '../../helpers/links';
import { UserProfileStackParams } from '../../types/navigation';
import { PublicUserInfo, Roles } from '../../types/user';
import { Images } from '../../../assets';
import DismissibleModal from '../../components/DismissibleModal';
import { UserEventData } from '../../types/events';
import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { truncateStringWithEllipsis } from '../../helpers/stringUtils';
import { reverseFormattedFirebaseName } from '../../types/committees';
import { formatDateWithYear } from '../../helpers/timeUtils';
import { hasPrivileges } from '../../helpers/rolesUtils';

export type PublicProfileScreenProps = {
    route: RouteProp<UserProfileStackParams, 'PublicProfile'>;
    navigation: NativeStackNavigationProp<UserProfileStackParams, 'PublicProfile'>;
};

const PublicProfileScreen: React.FC<PublicProfileScreenProps> = ({ route, navigation }) => {
    const { uid } = route.params;
    const userContext = useContext(UserContext);
    const { userInfo, setUserInfo } = userContext!;
    const isCurrentUser = uid === auth.currentUser?.uid;
    const routes = useNavigationState(state => state.routes);
    const isInProfileStack = routes.some(route => route.name === 'PublicProfile') && routes.length === 1;

    const fixDarkMode = userInfo?.private?.privateInfo?.settings?.darkMode;
    const useSystemDefault = userInfo?.private?.privateInfo?.settings?.useSystemDefault;
    const colorScheme = useColorScheme();
    const darkMode = useSystemDefault ? colorScheme === 'dark' : fixDarkMode;

    const [publicUserData, setPublicUserData] = useState<PublicUserInfo | undefined>();
    const { nationalExpiration, chapterExpiration, roles, photoURL, name, major, classYear, bio, points, resumeVerified, resumePublicURL, email, isStudent, committees, pointsRank, isEmailPublic } = publicUserData || {};

    const [events, setEvents] = useState<UserEventData[]>([]);
    const [modifiedRoles, setModifiedRoles] = useState<Roles | undefined>(undefined);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [updatingRoles, setUpdatingRoles] = useState<boolean>(false);
    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
    const [endOfData, setEndOfData] = useState(false);
    const lastVisibleRef = useRef<DocumentSnapshot | null>(null);

    const isAdmin = hasPrivileges(userInfo!, ['admin', 'officer', 'developer', 'representative']);

    useEffect(() => {
        const fetchUserData = async () => {
            const firebaseUser = await fetchAndStoreUser();
            if (firebaseUser) {
                setUserInfo(firebaseUser);
            }
        };

        const fetchInitialEventLogs = async () => {
            setEvents([]);
            const { events: initialEvents, lastVisibleDoc } = await getUserEventLogs(auth.currentUser?.uid!, 3, null, setEndOfData);
            setEvents(initialEvents);
            lastVisibleRef.current = lastVisibleDoc;
        };


        if (isCurrentUser) {
            fetchUserData();
            fetchInitialEventLogs();
        }
    }, [isCurrentUser])

    useFocusEffect(
        useCallback(() => {
            const fetchPublicUserData = async () => {
                await getPublicUserData(uid)
                    .then((res) => {
                        setPublicUserData(res);
                        setModifiedRoles(res?.roles);
                    })
                    .catch((error) => console.error("Failed to fetch public user data:", error))
                    .finally(() => {
                        setLoading(false);
                    });
            };

            fetchPublicUserData();

            return () => { };
        }, [])
    );

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

    const RoleItem = ({ roleName, isActive, onToggle }: { roleName: string, isActive: boolean, onToggle: () => void }) => {
        return (
            <Pressable onPress={onToggle} className='flex-row items-center py-1 mb-3'>
                <View className={`w-7 h-7 mr-3 rounded-full border ${isActive ? darkMode ? "bg-white" : "bg-black" : darkMode ? "border-white" : "border-black"}`} />
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>{roleName}</Text>
            </Pressable>
        );
    };

    return (
        <View className={`flex-1 ${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-white"}`}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <StatusBar style={darkMode ? "light" : "dark"} />
                <View>
                    <Image
                        className="flex w-full absolute h-full"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                        blurRadius={15}
                    />
                    {darkMode ? (
                        <View className='absolute w-full h-full bg-[#0007]' />
                    ) : (
                        <View className='absolute w-full h-full bg-[#fff4]' />

                    )}

                    <SafeAreaView edges={['top']}>
                        {/* Back and Edit Button */}
                        <View>
                            {(!isInProfileStack) &&
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    className="mx-4 w-10 h-10 items-center justify-center rounded-full"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                                >
                                    <Octicons name="chevron-left" size={30} color="white" />
                                </TouchableOpacity>
                            }
                            {(isInProfileStack) &&
                                <View className='flex-row justify-end'>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate("ProfileSettingsScreen")}
                                        className="p-4"
                                    >
                                        <FontAwesome6 name="edit" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                            }
                        </View>

                        <View className='items-center justify-center -mt-5 mb-8'>
                            {/* Profile Picture */}
                            <Image
                                className="flex w-52 h-52 rounded-full"
                                defaultSource={Images.DEFAULT_USER_PICTURE}
                                source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                            />
                            <View className='flex-row items-center mx-16'>
                                {/* General User Info */}
                                <View className='justify-center items-center'>
                                    <View className="flex-col justify-center mt-4 flex-wrap">
                                        <View className="relative flex-row items-center flex-wrap">
                                            <Text className="text-white text-3xl font-semibold text-center">{(name) ?? "Name"}</Text>
                                        </View>
                                    </View>
                                    <View className='items-center justify-center'>
                                        <Text className="text-white text-lg font-semibold">
                                            {`${major} ${"'" + classYear?.substring(2)}`}
                                            {points !== undefined && ` • ${points.toFixed(2)} pts`}
                                        </Text>
                                    </View>
                                </View>
                                <View className='absolute -right-12'>
                                    {(isEmailPublic && email && email.trim() !== "") && (
                                        <TouchableOpacity
                                            className='items-center justify-center w-11 h-11 rounded-full'
                                            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                                            onPress={() => (handleLinkPress('mailto:' + email))}
                                        >
                                            <FontAwesome name="envelope" size={24} color="white" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Edit Role Button */}
                            {isAdmin &&
                                <TouchableOpacity
                                    onPress={() => setShowRoleModal(true)}
                                    className="rounded-xl px-3 py-2 mt-4"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                                >
                                    <Text className='text-white font-semibold text-xl'>Edit Role</Text>
                                </TouchableOpacity>
                            }
                        </View>
                        {/* MemberSHPE Button */}
                        {(isVerified) &&
                            <TouchableOpacity
                                onPress={() => navigation.navigate("MemberSHPE")}
                                disabled={!isCurrentUser}
                                className="m-3 rounded-full absolute bottom-0 left-0 items-center justify-center"
                                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                            >
                                <Image
                                    resizeMode='contain'
                                    className='w-16  h-16'
                                    source={Images.SHPE_WHITE}
                                />
                            </TouchableOpacity>
                        }
                    </SafeAreaView>
                </View>

                {/* Profile Body */}
                <View className="flex-col mx-4 my-8">
                    {/* User's Title */}
                    <View
                        className={`rounded-md p-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light "}`}
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
                        <View className='flex-row items-center mb-4'>
                            <Text className={`text-3xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                                {roles?.customTitle ? roles.customTitle :
                                    (isVerified ? "Member" :
                                        (isStudent ? "Student" : "Guest"))
                                }
                            </Text>
                        </View>
                        <Text className={`text-xl  ${darkMode ? "text-white" : "text-black"}`}>{bio}</Text>
                    </View>


                    {committees && committees.length > 0 && (
                        <View
                            className={`mt-8 rounded-md p-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <Text className={`mb-4 text-3xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>Committees</Text>
                            <View className='flex-row flex-wrap'>
                                {committees?.map((committeeName, index) => {
                                    return (
                                        <View
                                            className={`py-3 px-4 mr-2 mb-2 rounded-md bg-primary-blue`}
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
                                            <Text className={`text-lg text-white`}>{reverseFormattedFirebaseName(committeeName) || "Unknown"}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {(isCurrentUser && events.length > 0) && (
                        <View
                            className={`mt-8 rounded-md p-4 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`}
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
                            <View className='flex-row items-center justify-between mb-4'>
                                <Text className={`text-3xl font-semibold ${darkMode ? "text-white" : "text-black"}`}>My Event Log</Text>

                                <TouchableOpacity
                                    onPress={() => navigation.navigate("PersonalEventLogScreen")}
                                >
                                    <Text className='text-xl text-primary-blue py-2'>See All</Text>
                                </TouchableOpacity>
                            </View>

                            <View>
                                {events.map(({ eventData, eventLog }, index) => (
                                    <View className={`flex-row mb-4`} key={index}>
                                        <Text className={`flex-1 text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>{truncateStringWithEllipsis(eventData?.name, 22) || "None"}</Text>
                                        <Text className={`w-[30%] text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>{formatDateWithYear(eventData?.startTime?.toDate()!)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView >

            {/* Role Modal */}
            <DismissibleModal visible={showRoleModal} setVisible={setShowRoleModal}>
                <View className={`flex opacity-100 rounded-md p-6 ${darkMode ? "bg-secondary-bg-dark" : "bg-secondary-bg-light"}`} style={{ width: 325 }}>
                    {/* Title */}
                    <View className='flex-row items-center mb-4'>
                        <FontAwesome name="user" color={darkMode ? "white" : "black"} size={30} />
                        <Text className={`text-2xl font-semibold ml-2 ${darkMode ? "text-white" : "text-black"}`}>User Permissions</Text>
                    </View>

                    {/* Position Custom Title */}
                    <View>
                        <Text className={`text-lg font-semibold ${darkMode ? "text-white" : "text-black"}`}>Enter a custom title</Text>
                        <TextInput
                            className={`border-b mb-5 text-lg pb-1 ${darkMode ? "text-white border-grey-light" : "text-black border-grey-light"}`}
                            onChangeText={(text) => {
                                setModifiedRoles({
                                    ...modifiedRoles,
                                    customTitle: text || ""
                                });
                            }}
                            placeholder='Enter title'
                            placeholderTextColor={darkMode ? "white" : "black"}
                            value={modifiedRoles?.customTitle}
                        />

                        <Text className={`text-lg font-semibold mb-2  mt-6 ${darkMode ? "text-white" : "text-black"}`}>Select user role</Text>
                    </View>

                    {/* Position Selection */}
                    <View>
                        <RoleItem
                            roleName="Admin"
                            isActive={modifiedRoles?.admin || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, admin: !modifiedRoles?.admin })}
                        />
                        <RoleItem
                            roleName="Developer"
                            isActive={modifiedRoles?.developer || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, developer: !modifiedRoles?.developer })}
                        />
                        <RoleItem
                            roleName="Officer"
                            isActive={modifiedRoles?.officer || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, officer: !modifiedRoles?.officer })}
                        />
                        <RoleItem
                            roleName="Secretary"
                            isActive={modifiedRoles?.secretary || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, secretary: !modifiedRoles?.secretary })}
                        />
                        <RoleItem
                            roleName="Representative"
                            isActive={modifiedRoles?.representative || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, representative: !modifiedRoles?.representative })}
                        />
                        <RoleItem
                            roleName="Lead"
                            isActive={modifiedRoles?.lead || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, lead: !modifiedRoles?.lead })}
                        />
                        <RoleItem
                            roleName="Coach"
                            isActive={modifiedRoles?.coach || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, coach: !modifiedRoles?.coach })}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row justify-between items-center my-6">
                        <TouchableOpacity
                            onPress={async () => {
                                // checks if has role but no custom title
                                if ((modifiedRoles?.admin || modifiedRoles?.developer || modifiedRoles?.officer || modifiedRoles?.secretary || modifiedRoles?.representative || modifiedRoles?.lead || modifiedRoles?.coach) && !modifiedRoles?.customTitle && !modifiedRoles?.customTitle?.length) {
                                    Alert.alert("Missing Title", "You must enter a title ");
                                    return;
                                }

                                // Checks if has custom title but no role
                                if (!modifiedRoles?.admin && !modifiedRoles?.developer && !modifiedRoles?.officer && !modifiedRoles?.secretary && !modifiedRoles?.representative && !modifiedRoles?.lead && !modifiedRoles?.coach && modifiedRoles?.customTitle) {
                                    Alert.alert("Missing Role", "If a custom title is entered, you must select a role.");
                                    return;
                                }

                                setUpdatingRoles(true);
                                if (modifiedRoles)
                                    await setUserRoles(uid, modifiedRoles)
                                        .then(() => {
                                            Alert.alert("Permissions Updated", "This user's roles have been updated successfully!");
                                        })
                                        .catch((err) => {
                                            console.error(err);
                                            Alert.alert("An Issue Occurred", "A server issue has occurred. Please try again. If this keeps occurring, please contact a developer");
                                        });

                                setUpdatingRoles(false);
                                setShowRoleModal(false);
                            }}
                            className="flex-1 bg-primary-blue rounded-lg justify-center items-center py-2"
                        >
                            <Text className='text-xl font-bold text-white px-2'>Done</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={async () => {
                                setModifiedRoles(roles);
                                setShowRoleModal(false);
                            }}
                            className="flex-1 justify-center items-center py-2"
                        >
                            <Text className={`flex-1 text-xl font-bold px-4 py-1 ${darkMode ? "text-white" : "text-black"}`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    {updatingRoles && <ActivityIndicator size="small" className='mb-4' />}
                </View>
            </DismissibleModal>
        </View>
    )
}

export default PublicProfileScreen;