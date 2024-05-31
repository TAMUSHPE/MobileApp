import { View, Text, Image, TouchableOpacity, ScrollView, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { AdminDashboardParams } from '../../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MembersList from '../../components/MembersList';
import { PublicUserInfo } from '../../types/user';
import { addToBlacklist, addToWatchlist, getBlacklist, getMembersExcludeOfficers, getWatchlist, removeFromBlacklist, removeFromWatchlist } from '../../api/firebaseUtils';
import { Images } from '../../../assets';
import DismissibleModal from '../../components/DismissibleModal';



const RestrictionsEditor = ({ navigation }: NativeStackScreenProps<AdminDashboardParams>) => {
    const [members, setMembers] = useState<PublicUserInfo[]>([])
    const [watchList, setWatchList] = useState<PublicUserInfo[]>([])
    const [blackList, setBlackList] = useState<PublicUserInfo[]>([])
    const [blackListModal, setBlackListModal] = useState(false);
    const [watchListModal, setWatchListModal] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const fetchedMembers = await getMembersExcludeOfficers();
                setMembers(fetchedMembers);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };

        const fetchWatchList = async () => {
            try {
                const fetchedWatchList = await getWatchlist();
                setWatchList(fetchedWatchList);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        }

        const fetchBlackList = async () => {
            try {
                const fetchedBlackList = await getBlacklist();
                setBlackList(fetchedBlackList);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        }

        fetchMembers();
        fetchWatchList();
        fetchBlackList();
    }, [])

    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View className='flex-row items-center h-10'>
                <View className='pl-6'>
                    <TouchableOpacity activeOpacity={1} className="px-2" onPress={() => navigation.goBack()}>
                        <Octicons name="chevron-left" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View className='flex-1 items-center'>
                    <Text className="text-2xl font-bold text-black">Restrictions</Text>
                </View>
                <View className="pr-6">
                    <TouchableOpacity activeOpacity={1} onPress={() => setInfoVisible(true)}>
                        <Octicons name="info" size={25} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity className='mx-8 mt-8 flex-row items-center'
                onPress={() => setWatchListModal(true)}
            >
                <Text className='text-2xl font-bold'>Watch List</Text>
                <View className='ml-3 bg-pale-blue rounded-full h-5 w-5 items-center justify-center'>
                    <Octicons name="plus" size={15} color="white" />
                </View>
            </TouchableOpacity>
            <ScrollView className='flex-1 h-screen'>
                <View className='flex-col mt-4'>
                    {watchList?.map((userData, index) => {
                        const { name, roles, uid, displayName, photoURL, chapterExpiration, nationalExpiration } = userData
                        return (
                            <View className='flex-row items-center' key={index}>
                                <TouchableOpacity
                                    className='ml-5 w-[60%]'
                                    onPress={() => { navigation.navigate('PublicProfile', { uid: uid! }) }}
                                >
                                    <View className="flex-row">
                                        <Image
                                            className="flex w-12 h-12 rounded-full"
                                            defaultSource={Images.DEFAULT_USER_PICTURE}
                                            source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                                        />
                                        <View className='ml-2 my-1'>
                                            <View>
                                                <Text className='font-semibold text-lg'>{name}</Text>
                                                <Text className='text-md text-grey'> {displayName}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className='px-4 flex-1 h-full justify-center'
                                    onPress={() => {
                                        setWatchList(prevWatchList => prevWatchList.filter(member => member.uid !== uid));
                                        removeFromWatchlist(userData);
                                    }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>


            <TouchableOpacity className='mx-8 mt-8 flex-row items-center'
                onPress={() => setBlackListModal(true)}
            >
                <Text className='text-2xl font-bold'>Black List</Text>
                <View className='ml-3 bg-pale-blue rounded-full h-5 w-5 items-center justify-center'>
                    <Octicons name="plus" size={15} color="white" />
                </View>
            </TouchableOpacity>
            <ScrollView className='flex-1 h-screen'>
                <View className='flex-col mt-4'>
                    {blackList?.map((userData, index) => {
                        const { name, roles, uid, displayName, photoURL, chapterExpiration, nationalExpiration } = userData
                        return (
                            <View className='flex-row items-center' key={index}>
                                <TouchableOpacity
                                    className='ml-5 w-[60%]'
                                    onPress={() => { navigation.navigate('PublicProfile', { uid: uid! }) }}
                                >
                                    <View className="flex-row">
                                        <Image
                                            className="flex w-12 h-12 rounded-full"
                                            defaultSource={Images.DEFAULT_USER_PICTURE}
                                            source={photoURL ? { uri: photoURL as string } : Images.DEFAULT_USER_PICTURE}
                                        />
                                        <View className='ml-2 my-1'>
                                            <View>
                                                <Text className='font-semibold text-lg'>{name}</Text>
                                                <Text className='text-md text-grey'> {displayName}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className='px-4 flex-1 h-full justify-center'
                                    onPress={() => {
                                        setBlackList(prevBlackList => prevBlackList.filter(member => member.uid !== uid));
                                        removeFromBlacklist(userData);
                                    }}
                                >
                                    <Octicons name="x" size={26} color="red" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={watchListModal}
                onRequestClose={() => {
                    setWatchListModal(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4 justify-end'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select User</Text>
                        </View>
                        <TouchableOpacity
                            className='px-4 mr-3'
                            onPress={() => setWatchListModal(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList
                            handleCardPress={(uid) => {
                                const memberToAdd = members.find(member => member.uid === uid);
                                if (memberToAdd && !watchList.some(watchMember => watchMember.uid === uid)) {
                                    setWatchList(prevWatchList => [...prevWatchList, memberToAdd]);
                                    addToWatchlist(memberToAdd);
                                }

                                setWatchListModal(false);
                            }}
                            users={members}
                        />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={blackListModal}
                onRequestClose={() => {
                    setBlackListModal(false);
                }}
            >
                <View
                    style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                    className='bg-white'>

                    <View className='flex-row items-center h-10 mb-4 justify-end'>
                        <View className='w-screen absolute'>
                            <Text className="text-2xl font-bold justify-center text-center">Select User</Text>
                        </View>
                        <TouchableOpacity
                            className='px-4 mr-3'
                            onPress={() => setBlackListModal(false)}
                        >
                            <Octicons name="x" size={26} color="black" />
                        </TouchableOpacity>
                    </View>


                    <View className="h-[100%] w-[100%] bg-white">
                        <MembersList
                            handleCardPress={(uid) => {
                                const memberToAdd = members.find(member => member.uid === uid);

                                if (memberToAdd && !blackList.some(blackMember => blackMember.uid === uid)) {
                                    setBlackList(prevBlackList => [...prevBlackList, memberToAdd]);
                                    addToBlacklist(memberToAdd);

                                    setWatchList(prevWatchList => prevWatchList.filter(member => member.uid !== uid));
                                    removeFromWatchlist(memberToAdd);
                                }

                                setBlackListModal(false);
                            }}
                            users={watchList}
                        />
                    </View>
                </View>
            </Modal>

            <DismissibleModal
                visible={infoVisible}
                setVisible={setInfoVisible}
            >
                <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6' style={{ minWidth: 325 }}>
                    <View className='flex-row items-center justify-between'>
                        <View className='flex-row items-center'>
                            <Octicons name="info" size={24} color="black" />
                            <Text className='text-2xl font-semibold ml-2'>Instructions</Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={() => setInfoVisible(false)}>
                                <Octicons name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>User on the watch list have perform an action classified as "bad behavior". This means that this user is using the app in a way that is not intended. </Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>This is important to reduce unnecessary cost for the app.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>A user on the watch list will not be restricted but simply there to keep an eye on. A user on the black list will be restricted from using the app.</Text>
                    </View>

                    <View className='w-[85%]'>
                        <Text className='text-md font-semibold'>A user must be manually added to the black list</Text>
                    </View>
                </View>
            </DismissibleModal>

        </SafeAreaView>
    )
}

export default RestrictionsEditor