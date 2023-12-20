import { View, Text, ActivityIndicator, Image, Modal, Alert, TouchableOpacity, Linking, TouchableWithoutFeedback, Pressable, TextInput } from 'react-native';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { BlurView } from '@react-native-community/blur';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/firebaseConfig';
import { UserContext } from '../context/UserContext';
import { getCommittees, getPublicUserData, setUserRoles } from '../api/firebaseUtils';
import { getBadgeColor, isMemberVerified } from '../helpers/membership';
import { MembersScreenRouteProp, MembersStackParams } from '../types/Navigation';
import { PublicUserInfo, Roles } from '../types/User';
import { Committee } from '../types/Committees';
import { Images } from '../../assets';
import TwitterSvg from '../components/TwitterSvg';
import ProfileBadge from '../components/ProfileBadge';
import { handleLinkPress } from '../helpers/links';



const PublicProfileScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    // Data related to public profile user
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;
    const [loading, setLoading] = useState<boolean>(true);
    const [publicUserData, setPublicUserData] = useState<PublicUserInfo | undefined>();
    const { nationalExpiration, chapterExpiration, roles, photoURL, name, major, classYear, bio, points, resumeVerified, resumePublicURL, email, tamuEmail, committees } = publicUserData || {};
    const [updatingRoles, setUpdatingRoles] = useState<boolean>(false);
    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
    const [modifiedRoles, setModifiedRoles] = useState<Roles | undefined>(undefined);
    const [committeesData, setCommitteesData] = useState<Committee[]>([]);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const isOfficer = roles ? roles.officer : false;
    let badgeColor = getBadgeColor(isOfficer!, isVerified);


    // Data related to currently authenticated user
    const { userInfo } = useContext(UserContext)!;
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer

    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

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

    // used to get committee color
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


    useEffect(() => {
        if (!modifiedRoles?.admin && !modifiedRoles?.developer && !modifiedRoles?.officer && !modifiedRoles?.secretary && !modifiedRoles?.representative && !modifiedRoles?.lead) {
            if (modifiedRoles?.customTitle !== "") {
                setModifiedRoles({
                    ...modifiedRoles,
                    customTitle: "",
                });
            }
        }
    }, [modifiedRoles]);

    const RoleItem = ({ roleName, isActive, onToggle, darkMode }: { roleName: string, isActive: boolean, onToggle: () => void, darkMode: boolean }) => {
        return (
            <View className='flex-row items-center py-1 mb-3'>
                <Pressable
                    onPress={onToggle}
                >
                    <View className={`w-7 h-7 mr-3 rounded-full border ${isActive && "bg-black"}`} />
                </Pressable>
                <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>{roleName}</Text>
            </View>
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
        <View className='flex-1'>
            <StatusBar style="light" />

            {/* Profile Header */}
            <View>
                <Image
                    className="flex w-full absolute h-full"
                    defaultSource={Images.DEFAULT_USER_PICTURE}
                    source={photoURL ? { uri: photoURL } : Images.DEFAULT_USER_PICTURE}
                />
                <BlurView
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    blurType="dark"
                    blurAmount={20}
                />

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
                            {uid === auth.currentUser?.uid &&
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("SettingsScreen")}
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
                                {(isOfficer || isVerified) && (
                                    <TwitterSvg className="absolute left-full ml-1" color={badgeColor} />
                                )}
                            </View>

                        </View>
                        <View className='items-center justify-center'>
                            <Text className="text-white text-lg font-semibold" >{`${major} ${"'" + classYear?.substring(2)}`} • {`${points?.toFixed(2)} pts`}  </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>


            {/* Profile Body */}
            <View className="flex-col m-8">

                <View className='flex-row items-center'>
                    <Text className='text-2xl italic'>
                        {roles?.customTitle ? roles.customTitle :
                            (isVerified ? "Member" :
                                (tamuEmail != "" ? "Student" : "Guest"))
                        }
                    </Text>

                    {isSuperUser &&
                        <View className='items-center justify-center'>
                            <TouchableOpacity
                                onPress={() => setShowRoleModal(true)}
                                className='rounded-md px-2 py-1 ml-4 bg-pale-blue'
                            >
                                <Text className='text-white text-xl'>Select Role</Text>
                            </TouchableOpacity>
                        </View>
                    }
                </View>
                <Text className='text-lg'>{bio}</Text>
                <View className='flex-row mt-4 items-center'>
                    <TouchableOpacity
                        className='items-center justify-center mr-6'
                        onPress={() => (handleLinkPress('mailto:' + email))}
                    >
                        <FontAwesome name="envelope" size={24} color="black" />
                        <Text className='text-lg font-semibold'>Email</Text>
                    </TouchableOpacity>

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

            {/* Role Modal */}
            <Modal
                animationType="none"
                transparent={true}
                visible={showRoleModal}
            >
                <TouchableOpacity
                    onPress={() => setShowRoleModal(false)}
                    className="h-[100%] w-[100%]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                    <View className='items-center justify-center h-full '>
                        <TouchableWithoutFeedback>
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
                                            if ((modifiedRoles?.admin || modifiedRoles?.developer || modifiedRoles?.officer || modifiedRoles?.secretary || modifiedRoles?.representative || modifiedRoles?.lead) && !modifiedRoles?.customTitle && !modifiedRoles?.customTitle?.length) {
                                                Alert.alert("Missing Title", "You must enter a title ");
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
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity >
            </Modal >
        </View>
    )
}


export default PublicProfileScreen;