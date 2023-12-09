import { View, Text, ActivityIndicator, Image, TouchableHighlight, Modal, Switch, Alert } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { useRoute } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import { getPublicUserData, setUserRoles } from '../api/firebaseUtils';
import { MembersScreenRouteProp, MembersStackParams } from '../types/Navigation';
import { PublicUserInfo, Roles } from '../types/User';
import { Images } from '../../assets';
import { Octicons } from '@expo/vector-icons';
import ProfileBadge from '../components/ProfileBadge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommitteeConstants, CommitteeKey } from '../types/Committees';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserContext } from '../context/UserContext';

const PublicProfileScreen = ({ navigation }: NativeStackScreenProps<MembersStackParams>) => {
    // Data related to public profile user
    const route = useRoute<MembersScreenRouteProp>();
    const { uid } = route.params;
    const [publicUserData, setPublicUserData] = useState<PublicUserInfo | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [updatingRoles, setUpdatingRoles] = useState<boolean>(false);
    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
    const [modifiedRoles, setModifiedRoles] = useState<Roles | undefined>(undefined);

    // Data related to currently authenticated user
    const { userInfo } = useContext(UserContext)!;
    const isSuperUser = userInfo?.publicInfo?.roles?.admin || userInfo?.publicInfo?.roles?.developer || userInfo?.publicInfo?.roles?.officer
    const darkMode = userInfo?.private?.privateInfo?.settings?.darkMode;

    useEffect(() => {
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
    }, [auth]);

    if (loading) {
        return (
            <View className='fixed top-1/2 -translate-y-1/2 '>
                <ActivityIndicator
                    size="large"
                    animating={true}
                    color="rgba(137,232,207,100)"
                />
            </View>
        );
    }

    return (
        <SafeAreaView className='h-full' edges={['right', 'top', 'left']}>
            <Modal
                visible={showRoleModal}
                animationType='slide'
                transparent
            >
                <View className='h-full bg-[#000000AA] backdrop-blur-md flex-col justify-center'>
                    <View className={`${darkMode ? "bg-primary-bg-dark" : "bg-primary-bg-light"} rounded-md mx-10 py-2`}>
                        <View className='px-5 flex-row items-center justify-between py-1'>
                            <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>Developer Permissions</Text>
                            <Switch
                                onValueChange={() => {
                                    setModifiedRoles({
                                        ...modifiedRoles,
                                        developer: !modifiedRoles?.developer
                                    })
                                }}
                                value={modifiedRoles?.developer}
                            />
                        </View>
                        <View className='px-5 flex-row items-center justify-between py-1'>
                            <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>Officer Permissions</Text>
                            <Switch
                                onValueChange={() => {
                                    setModifiedRoles({
                                        ...modifiedRoles,
                                        officer: !modifiedRoles?.officer
                                    })
                                }}
                                value={modifiedRoles?.officer}
                            />
                        </View>
                        <View className='px-5 flex-row items-center justify-between py-1 mb-2'>
                            <Text className={`${darkMode ? "text-white" : "text-black"} text-lg`}>Admin Permissions</Text>
                            <Switch
                                onValueChange={() => {
                                    setModifiedRoles({
                                        ...modifiedRoles,
                                        admin: !modifiedRoles?.admin
                                    })
                                }}
                                value={modifiedRoles?.admin}
                            />
                        </View>
                        <View className='flex-row justify-center'>
                            <TouchableHighlight
                                className='rounded-4xl rounded-4xl px-8 py-2'
                                onPress={() => setShowRoleModal(false)}
                                underlayColor={`${darkMode ? "#6a6a6a" : "#BBB"}`}
                            >
                                <Text className={`${darkMode ? "text-gray-300" : "text-black"} text-xl font-bold`}>Cancel</Text>
                            </TouchableHighlight>
                            <TouchableHighlight
                                className='rounded-2xl px-8 py-2'
                                onPress={async () => {
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
                                underlayColor={`${darkMode ? "#6a6a6a" : "#BBB"}`}
                            >
                                <Text className={`${darkMode ? "text-continue-dark" : "text-continue-light"} text-xl font-bold`}>Done</Text>
                            </TouchableHighlight>
                        </View>
                    </View>
                </View>
                {updatingRoles && <ActivityIndicator className='absolute top-0 bottom-0 left-0 right-0' size={100} />}
            </Modal>
            <View className='flex-row items-center justify-between'>
                <TouchableHighlight className='py-3 px-6' onPress={() => navigation.goBack()} underlayColor="offwhite">
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableHighlight>
                {
                    isSuperUser &&
                    <TouchableHighlight className='py-2 px-6' onPress={() => setShowRoleModal(true)} underlayColor="offwhite">
                        <Octicons name="grabber" size={40} color="black" />
                    </TouchableHighlight>
                }
            </View>
            <View className="items-center justify-center flex-1 space-y-8">
                <View className='flex items-center justify-center'>
                    <Image
                        className="flex w-28 h-28 rounded-full"
                        defaultSource={Images.DEFAULT_USER_PICTURE}
                        source={publicUserData?.photoURL ? { uri: publicUserData?.photoURL } : Images.DEFAULT_USER_PICTURE}
                    />
                    <View className='flex-row items-center justify-start'>
                        <Text className='text-2xl font-bold'> {publicUserData?.name} </Text>
                        <View className='rounded-full w-2 h-2 bg-orange ml-1' />
                        <Text className='font-bold'> {`${publicUserData?.points?.toFixed(2)} pts`} </Text>
                    </View>
                    <Text className='text-gray-500'> {publicUserData?.email} </Text>
                </View>
                <View className='bg-white w-4/5 rounded-xl items-center pt-3 pb-7 px-7 space-y-1 shadow-md shadow-black'>
                    <Text className='text-xl font-bold'> {`${publicUserData?.major} ${publicUserData?.classYear}`} </Text>
                    <Text className=''> {`${publicUserData?.bio}`} </Text>
                </View>
                <View className='bg-white w-4/5 rounded-xl pt-3 pb-12 px-2 space-y-2 shadow-md shadow-black items-center'>
                    <Text className='text-xl font-bold'> Committees </Text>
                    <View className='flex-row flex-wrap'>
                        {publicUserData?.committees?.map((key: string) => {
                            const committeeInfo = CommitteeConstants[key as CommitteeKey];
                            if (committeeInfo) {
                                return (
                                    <ProfileBadge
                                        key={key}
                                        text={committeeInfo.name}
                                        badgeColor={committeeInfo ? committeeInfo?.color : ""}
                                        textClassName='text-center text-xs'
                                    />
                                );
                            }
                        })}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default PublicProfileScreen;