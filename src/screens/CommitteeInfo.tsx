import { View, Text, Image, Modal, TouchableOpacity, Linking, TouchableWithoutFeedback, ScrollView, TouchableHighlight, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useContext, useEffect, useState } from 'react'
import { useRoute } from '@react-navigation/native';
import { Images } from '../../assets';
import { Octicons } from '@expo/vector-icons';
import { PublicUserInfo } from '../types/User';
import { CommitteeScreenRouteProp, CommitteesListProps } from '../types/Navigation';
import { UserContext } from '../context/UserContext';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebaseConfig';
import { setPublicUserData, addToWatchlist } from '../api/firebaseUtils';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfileProps { userInfo: PublicUserInfo | null }
const UserProfile: React.FC<UserProfileProps> = ({ userInfo }) => {
    return (
        <TouchableOpacity className='flex-col items-center w-40'>
            <Image className='h-24 w-24 rounded-full' source={userInfo?.photoURL ? { uri: userInfo?.photoURL } : Images.DEFAULT_USER_PICTURE} />
            <Text className='text-lg'>{userInfo?.name}</Text>
            <Text>{userInfo?.email}</Text>
        </TouchableOpacity>
    );
}

const CommitteesInfo: React.FC<CommitteesListProps> = ({ navigation }) => {
    const route = useRoute<CommitteeScreenRouteProp>();
    const initialCommittee = route.params.committee;
    const { userInfo, setUserInfo } = useContext(UserContext)!;

    const [currentCommittee, setCurrentCommittee] = useState(initialCommittee);
    const [isInCommittee, setIsInCommittee] = useState<boolean>();
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [lastPassTime, setLastPassTime] = useState(0)
    const DEBOUNCE_TIME = 10000; // 10 seconds

    const { name, color, image, head, leads, description, memberApplicationLink, leadApplicationLink, firebaseDocName } = initialCommittee;
    const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());


    const updateCommitteeMembersCount = httpsCallable(functions, 'updateCommitteeMembersCount');

    useEffect(() => {
        const committeeExists = userInfo?.publicInfo?.committees?.includes(firebaseDocName!);
        setIsInCommittee(committeeExists);
    }, [userInfo, firebaseDocName]);

    const fetchCommitteeData = async () => {
        try {
            const docRef = doc(db, `committees/${initialCommittee.firebaseDocName}`);
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
                setCurrentCommittee(docSnapshot.data());
            }
        } catch (error) {
            console.error('Error fetching updated committee data:', error);
        }
    };

    const handleLinkPress = async (url: string) => {
        if (!url) {
            console.warn(`Empty/Falsy URL passed to handleLinkPress(): ${url}`);
            return;
        }

        await Linking.canOpenURL(url)
            .then(async (supported) => {
                if (supported) {
                    await Linking.openURL(url)
                        .catch((err) => console.error(`Issue opening url: ${err}`));
                } else {
                    console.warn(`Don't know how to open this URL: ${url}`);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    return (
        <ScrollView style={{ backgroundColor: color }}>
            <SafeAreaView className='h-full pb-2' edges={['right', 'top', 'left']}>
                <TouchableHighlight className='py-3 px-6' onPress={() => navigation.goBack()} underlayColor="offwhite">
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableHighlight>
                {hasPrivileges && (

                    <TouchableOpacity
                        className='flex-row items-center justify-center rounded-md bg-white w-24 py-4  mx-auto mt-5 mb-2'
                        onPress={() => {
                            navigation.navigate('CommitteeEditor', { committee: currentCommittee });
                        }}
                    >
                        <Text className="font-bold text-lg">Edit</Text>
                    </TouchableOpacity>
                )}
                <View className='flex-auto items-center gap-4'>
                    <Text className='text-[32px] font-bold'>{name}</Text>
                    <Image className='h-48 w-80 bg-white' source={image || Images.COMMITTEE_4} />
                    <Text className='text-lg pt-5 px-5'>{description || "No description provided"}</Text>
                    <View className='flex-row py-2'>
                        <Text className='text-3xl'>Members: </Text>
                        <Text className='text-4xl'>{currentCommittee.memberCount}</Text>
                    </View>
                    <View className='flex-row space-x-2 pb-5'>
                        <TouchableOpacity
                            className='bg-white rounded-xl w-1/6 items-center justify-center'
                            onPress={() => setConfirmVisible(!confirmVisible)}
                        >
                            <Text className='text-[45px]'>{isInCommittee ? "-" : "+"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='bg-white rounded-xl w-1/3 items-center justify-center'
                            onPress={() => handleLinkPress(memberApplicationLink || '')}
                        >
                            <Text className='text-center text-[20px] font-medium'>Member Application</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='bg-white rounded-xl w-1/3 items-center justify-center border-gray-600 border'
                            onPress={() => handleLinkPress(leadApplicationLink || '')}
                        >
                            <Text className='text-center text-[20px] font-medium'>Lead Application</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View className='ml-6'>
                    <Text className='text-3xl font-semibold'>Officer</Text>
                    <UserProfile userInfo={head!} />
                    <Text className='text-3xl font-semibold'>Leads</Text>
                    <FlatList
                        data={leads!}
                        horizontal={true}
                        renderItem={({ item, index }) => {
                            return (
                                <UserProfile userInfo={item} key={index}></UserProfile>
                            )
                        }}
                    />
                </View>

            </SafeAreaView>

            <Modal
                animationType="none"
                transparent={true}
                visible={confirmVisible}
                onRequestClose={() => setConfirmVisible(!confirmVisible)}
            >
                <TouchableOpacity
                    onPress={() => setConfirmVisible(false)}
                    className="h-[100%] w-[100%]"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                    <View className='items-center justify-center h-full'>
                        <TouchableWithoutFeedback>
                            <View className='flex opacity-100 bg-white rounded-md p-6 space-y-6'>
                                <Octicons name="person" size={24} color="black" />
                                <View className='flex items-center w-[80%] space-y-8'>
                                    <Text className="text-center text-lg font-bold"> {isInCommittee ? "Are you sure you want leave?" : "Are you sure you want to join?"}</Text>
                                    <View className="flex-row">
                                        <TouchableOpacity
                                            onPress={async () => {
                                                setConfirmVisible(false);
                                                const currentTime = Date.now();
                                                if (currentTime - lastPassTime >= DEBOUNCE_TIME) {
                                                    const committeeChanges = [{
                                                        committeeName: firebaseDocName,
                                                        change: isInCommittee ? -1 : 1
                                                    }];

                                                    try {
                                                        await updateCommitteeMembersCount({ committeeChanges })
                                                            .then(() => {
                                                                fetchCommitteeData();
                                                                setLastPassTime(currentTime)
                                                            });

                                                        // Update user's committees array
                                                        let updatedCommittees = [...userInfo?.publicInfo?.committees!!];
                                                        if (isInCommittee) {
                                                            updatedCommittees = updatedCommittees.filter(c => c !== firebaseDocName);
                                                        } else {
                                                            updatedCommittees.push(firebaseDocName!!);
                                                        }

                                                        await setPublicUserData({ committees: updatedCommittees });

                                                        setUserInfo({
                                                            ...userInfo,
                                                            publicInfo: {
                                                                ...userInfo?.publicInfo,
                                                                committees: updatedCommittees
                                                            }
                                                        });

                                                    } catch (error) {
                                                        console.error("Error updating committee count:", error);
                                                    }
                                                } else {
                                                    await addToWatchlist(auth.currentUser?.uid!);
                                                }
                                            }}
                                            className="bg-pale-blue rounded-xl justify-center items-center"
                                        >
                                            <Text className='text-xl font-bold text-white px-8'>{isInCommittee ? "Leave" : "Join"}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={async () => { setConfirmVisible(false) }} >
                                            <Text className='text-xl font-bold py-3 px-8'> Cancel </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity >
            </Modal>

        </ScrollView>
    )
}

export default CommitteesInfo