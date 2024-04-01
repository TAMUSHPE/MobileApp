import { View, Text, ActivityIndicator, Image, Alert, TouchableOpacity, Pressable, TextInput, ScrollView, RefreshControl } from 'react-native';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { UserContext } from '../context/UserContext';
import { auth } from '../config/firebaseConfig';
import { getCommittees, getPublicUserData, getUser, setUserRoles } from '../api/firebaseUtils';
import { getBadgeColor, isMemberVerified } from '../helpers/membership';
import { handleLinkPress } from '../helpers/links';
import { HomeDrawerParams, MembersScreenRouteProp } from '../types/Navigation';
import { PublicUserInfo, Roles } from '../types/User';
import { Committee } from '../types/Committees';
import { Images } from '../../assets';
import TwitterSvg from '../components/TwitterSvg';
import ProfileBadge from '../components/ProfileBadge';
import DismissibleModal from '../components/DismissibleModal';



const PublicProfileScreen = ({ navigation }: NativeStackScreenProps<HomeDrawerParams>) => {
    // Data related to public profile user
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;
    const [publicUserData, setPublicUserData] = useState<PublicUserInfo | undefined>();
    const { nationalExpiration, chapterExpiration, roles, photoURL, name, major, classYear, bio, points, resumeVerified, resumePublicURL, email, isStudent, committees, pointsRank, isEmailPublic } = publicUserData || {};
    const [committeesData, setCommitteesData] = useState<Committee[]>([]);
    const [modifiedRoles, setModifiedRoles] = useState<Roles | undefined>(undefined);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const isOfficer = roles ? roles.officer : false;
    const badgeColor = getBadgeColor(isOfficer!, isVerified);
    const isCurrentUser = uid === auth.currentUser?.uid;

    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingRoles, setUpdatingRoles] = useState<boolean>(false);
    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

    // Data related to currently authenticated user
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    const onRefresh = useCallback(async () => {
        if (isCurrentUser) {
            setRefreshing(true);
            try {
                const firebaseUser = await getUser(auth.currentUser?.uid!)
                await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                await setUserInfo(firebaseUser);
            } catch (error) {
                console.error("Error updating user:", error);
            } finally {
                setRefreshing(false);
            }
        }
    }, [uid]);

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
        }, [auth])
    );

    // used to get committee color for badges
    useEffect(() => {
        const fetchCommitteeData = async () => {
            const response = await getCommittees();
            setCommitteesData(response);
        }
        fetchCommitteeData();
    }, [])

    useEffect(() => {
        if (nationalExpiration && chapterExpiration) {
            setIsVerified(isMemberVerified(nationalExpiration, chapterExpiration));
        }
    }, [nationalExpiration, chapterExpiration])

    const RoleItem = ({ roleName, isActive, onToggle, darkMode }: {
        roleName: string,
        isActive: boolean,
        onToggle: () => void,
        darkMode: boolean
    }) => {
        return (
            <Pressable onPress={onToggle} className='flex-row items-center py-1 mb-3'>
                <View className={`w-7 h-7 mr-3 rounded-full border ${isActive && "bg-black"}`} />
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>{roleName}</Text>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <View className='fixed top-1/2 -translate-y-1/2 '>
                <ActivityIndicator
                    size="large"
                    animating={true}
                />
            </View>
        );
    }

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
            bounces={isCurrentUser ? true : false}
        >
            <StatusBar style="light" />
            {/* Profile Header */}
            <View>
                <Image
                    className="flex w-full absolute h-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                    blurRadius={15}
                />
                <View className='absolute w-full h-full bg-[#0007]' />

                <SafeAreaView edges={['top']} >
                    <View className='flex-row justify-between items-center mx-5 mt-1'>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="rounded-full w-10 h-10 justify-center items-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                        >
                            <Octicons name="chevron-left" size={30} color="white" />
                        </TouchableOpacity>
                        <View className='flex-col relative items-center'>
                            {isCurrentUser &&
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("ProfileSettingsScreen")}
                                    className="rounded-md px-3 py-2"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                                >
                                    <Text className='text-white text-xl'>Edit</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>

                    <View className='flex items-center justify-center -mt-2 mb-8'>
                        <Image
                            className="flex w-52 h-52 rounded-full"
                            defaultSource={Images.DEFAULT_USER_PICTURE}
                            source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                        />

                        <View className="flex-col justify-center mt-2">
                            <View className="relative flex-row items-center">
                                <Text className="text-white text-3xl font-semibold">{name ?? "Name"}</Text>
                                {(isOfficer || isVerified) && <TwitterSvg color={badgeColor} className="ml-2" />}

                            </View>
                        </View>
                        <View className='items-center justify-center'>
                            <Text className="text-white text-lg font-semibold" >{`${major} ${"'" + classYear?.substring(2)}`} • {`${points?.toFixed(2)} pts`} {pointsRank && `• rank ${pointsRank}`} </Text>
                        </View>
                        {isSuperUser &&
                            <View className='items-center justify-center'>
                                <TouchableOpacity
                                    onPress={() => setShowRoleModal(true)}
                                    className="rounded-md px-3 py-2"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                                >
                                    <Text className='text-white text-xl'>Edit Role</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                </SafeAreaView>
            </View>

            {/* Profile Body */}
            <View className="flex-col m-8">
                <View className='flex-row items-center'>
                    <Text className='text-2xl italic'>
                        {roles?.customTitle ? roles.customTitle :
                            (isVerified ? "Member" :
                                (isStudent ? "Student" : "Guest"))
                        }
                    </Text>
                </View>
                <Text className='text-lg mt-2'>{bio}</Text>
                <View className='flex-row mt-4 items-center'>
                    {(isEmailPublic && email && email.trim() !== "") && (
                        <TouchableOpacity
                            className='items-center justify-center mr-6'
                            onPress={() => (handleLinkPress('mailto:' + email))}
                        >
                            <FontAwesome name="envelope" size={24} color="black" />
                            <Text className='text-lg font-semibold'>Email</Text>
                        </TouchableOpacity>
                    )}

                    {resumeVerified &&
                        <TouchableOpacity
                            className='items-center justify-center'
                            onPress={() => handleLinkPress(resumePublicURL!)}
                        >
                            <FontAwesome name="file" size={24} color="black" />
                            <Text className='text-lg font-semibold'>Resume</Text>
                        </TouchableOpacity>
                    }
                </View>

                {committees && committees.length > 0 && (
                    <View>
                        <Text className='text-2xl italic mt-5'>Involvement</Text>
                        <View className='flex-row flex-wrap mt-2'>
                            {committees?.map((committeeName, index) => {
                                const committeeData = committeesData.find(c => c.firebaseDocName === committeeName);

                                return (
                                    <ProfileBadge
                                        badgeClassName='p-2 max-w-2/5 rounded-md mr-1 mb-2'
                                        textClassName='text-lg'
                                        text={committeeData?.name || "Unknown Committee"}
                                        badgeColor={committeeData?.color || ""}
                                        key={index}
                                    />
                                );
                            })}
                        </View>
                    </View>
                )}
            </View>

            {/* Role Modal */}
            <DismissibleModal
                visible={showRoleModal}
                setVisible={setShowRoleModal}
            >
                <View
                    className='flex opacity-100 bg-white rounded-md px-6 pt-6'
                    style={{ minWidth: 300 }}
                >
                    {/* Title */}
                    <View className='flex-row items-center mb-4'>
                        <FontAwesome name="user" color="black" size={30} />
                        <Text className='text-2xl font-semibold ml-2'>User Permissions</Text>
                    </View>

                    {/* Position Custom Title */}
                    <View>
                        <Text className='text-lg font-semibold'>Enter a custom title</Text>
                        <Text className='text-sm text-gray-500 mb-2'>This is only used on profile screen</Text>
                        <TextInput
                            className='border-b mb-5 text-lg pb-1'
                            onChangeText={(text) => {
                                setModifiedRoles({
                                    ...modifiedRoles,
                                    customTitle: text || ""
                                })
                            }}
                            placeholder='Enter title'
                            value={modifiedRoles?.customTitle}
                        />

                        <Text className='text-lg font-semibold mb-2'>Select user role</Text>
                    </View>

                    {/* Position Selection */}
                    <View>
                        <RoleItem
                            roleName="Admin"
                            isActive={modifiedRoles?.admin || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, admin: !modifiedRoles?.admin })}
                            darkMode={darkMode || false}
                        />
                        <RoleItem
                            roleName="Developer"
                            isActive={modifiedRoles?.developer || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, developer: !modifiedRoles?.developer })}
                            darkMode={darkMode || false}

                        />
                        <RoleItem
                            roleName="Officer"
                            isActive={modifiedRoles?.officer || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, officer: !modifiedRoles?.officer })}
                            darkMode={darkMode || false}
                        />
                        <RoleItem
                            roleName="Secretary"
                            isActive={modifiedRoles?.secretary || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, secretary: !modifiedRoles?.secretary })}
                            darkMode={darkMode || false}
                        />
                        <RoleItem
                            roleName="Representative"
                            isActive={modifiedRoles?.representative || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, representative: !modifiedRoles?.representative })}
                            darkMode={darkMode || false}
                        />
                        <RoleItem
                            roleName="Lead"
                            isActive={modifiedRoles?.lead || false}
                            onToggle={() => setModifiedRoles({ ...modifiedRoles, lead: !modifiedRoles?.lead })}
                            darkMode={darkMode || false}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row justify-between items-center my-6 mx-5">
                        <TouchableOpacity
                            onPress={async () => {

                                // checks if has role but no custom title
                                if ((modifiedRoles?.admin || modifiedRoles?.developer || modifiedRoles?.officer || modifiedRoles?.secretary || modifiedRoles?.representative || modifiedRoles?.lead) && !modifiedRoles?.customTitle && !modifiedRoles?.customTitle?.length) {
                                    Alert.alert("Missing Title", "You must enter a title ");
                                    return;
                                }


                                // Checks if has custom title but no role
                                if (!modifiedRoles?.admin && !modifiedRoles?.developer && !modifiedRoles?.officer && !modifiedRoles?.secretary && !modifiedRoles?.representative && !modifiedRoles?.lead && modifiedRoles?.customTitle) {
                                    Alert.alert("Missing Role", "If a custom title is entered, you must select a role.");
                                    return;
                                }

                                setUpdatingRoles(true);
                                if (modifiedRoles)
                                    await setUserRoles(uid, modifiedRoles)
                                        .then(() => {
                                            Alert.alert("Permissions Updated", "This user's roles have been updated successfully!")
                                        })
                                        .catch((err) => {
                                            console.error(err);
                                            Alert.alert("An Issue Occured", "A server issue has occured. Please try again. If this keeps occurring, please contact a developer");
                                        });

                                setUpdatingRoles(false);
                                setShowRoleModal(false);
                            }}
                            className="bg-pale-blue rounded-lg justify-center items-center px-4 py-1"
                        >
                            <Text className='text-xl font-bold text-white px-2'>Done</Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                            onPress={async () => {
                                setModifiedRoles(roles)
                                setShowRoleModal(false)
                            }} >
                            <Text className='text-xl font-bold px-4 py-1'>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    {updatingRoles && <ActivityIndicator className='mb-4' size={30} />}
                </View>
            </DismissibleModal>
        </ScrollView>
    )
}


export default PublicProfileScreen;