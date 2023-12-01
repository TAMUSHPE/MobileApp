import { View, Text, Image, Modal, TouchableOpacity, Linking, TouchableWithoutFeedback, ScrollView, TouchableHighlight, FlatList} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { PureComponent, useContext, useEffect, useState } from 'react'
import { useRoute } from '@react-navigation/native';
import { Images } from '../../assets';
import { Octicons } from '@expo/vector-icons';
import { Committee, CommitteeKey } from '../types/Committees';
import { getCommitteeInfo, getPublicUserData, getUser, getWatchlist, setPublicUserData, setWatchlist } from '../api/firebaseUtils';
import { PublicUserInfo } from '../types/User';
import { CommitteeInfoScreenRouteProp, CommitteesTabProps } from '../types/Navigation';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { UserContext } from '../context/UserContext';
import { auth, functions } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommitteeConstants } from '../types/Committees';

interface UserProfileProps {userInfo: PublicUserInfo | null}
const UserProfile: React.FC<UserProfileProps> = ({userInfo}) => {
    return (
        <TouchableOpacity className='flex-col items-center w-40'>
            <Image className='h-24 w-24 rounded-full' source={userInfo?.photoURL ? { uri: userInfo?.photoURL } : Images.DEFAULT_USER_PICTURE}/>
            <Text className='text-lg'>{userInfo?.name}</Text>
            <Text>{userInfo?.email}</Text>
        </TouchableOpacity>
    );
}

const CommitteesInfo: React.FC<CommitteesTabProps> = ({navigation}) => {
    const route = useRoute<CommitteeInfoScreenRouteProp>();
    const { committee } = route.params;
    const { userInfo, setUserInfo } = useContext(UserContext)!;
    const [committees, setCommittees] = useState<Array<CommitteeKey | string> | undefined>(userInfo?.publicInfo?.committees);
    const [committeeInfo, setCommitteeInfo] = useState<Committee | null>(null);
    const [headUserInfo, setHeadUserInfo] = useState<PublicUserInfo | null>(null);
    const [leadsUserInfo, setLeadsUserInfo] = useState<PublicUserInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isInCommittee, setIsInCommittee] = useState<boolean>();
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

    // determine if user is in committee
    useEffect(() => {
        const mapCommitteesToFirebaseDocName = (committees: Array<CommitteeKey | string> | undefined) => {
            if (!committees) return undefined;

            return committees.map(committee => {
                const committeeInfo = CommitteeConstants[committee as CommitteeKey];
                return committeeInfo ? committeeInfo.firebaseDocName : committee;
            });
        };

        if (committees !== undefined) {
            const firebaseDocNames = mapCommitteesToFirebaseDocName(committees);
            setIsInCommittee(firebaseDocNames?.includes(committee.firebaseDocName!));
        }
    }, [committees, committee.name]);

    useEffect(() => {
        const fetchHeadUserData = async (uid: string) => {
            const fetchedInfo = await getPublicUserData(uid);
            if (fetchedInfo) {
                setHeadUserInfo({
                    ...fetchedInfo,
                    uid,
                });
            }
        };

        const fetchLeadUserData = async (uid: string) => {
            const fetchedInfo = await getPublicUserData(uid);
            if (fetchedInfo) {
                setLeadsUserInfo(prevState => [...prevState, { ...fetchedInfo, uid }]);
            }
        }

        const fetchCommitteeInfo = async () => {
            setCommitteeInfo(null);
            setHeadUserInfo(null);
            setLeadsUserInfo([]);
            if (committee.name) {
                const fetchedInfo = await getCommitteeInfo(committee.firebaseDocName!);
                if (fetchedInfo) {
                    setCommitteeInfo(fetchedInfo);
                    if (fetchedInfo.headUID) {
                        fetchHeadUserData(fetchedInfo.headUID);
                    }
                    if (fetchedInfo.leadUIDs && fetchedInfo.leadUIDs.length > 0) {
                        fetchedInfo.leadUIDs.forEach(uid => {
                            fetchLeadUserData(uid);
                        })
                    }

                }
            }
        }

        fetchCommitteeInfo();
    }, [committee.name]);


    const updateMemberCountLocally = () => {
        if (!committeeInfo) return;

        setCommitteeInfo(prevState => {
            if (prevState) {
                const adjustment = isInCommittee ? -1 : 1;
                return { ...prevState, memberCount: prevState.memberCount! + adjustment };
            }
            return prevState;
        });
    };


    const updateUserCommittee = async () => {
        let updatedCommittees: Array<CommitteeKey | string> | undefined = undefined;
        if (committees) {
            updatedCommittees = [...committees];

            if (isInCommittee) {
                const index = updatedCommittees.findIndex(
                    committeeKey => CommitteeConstants[committeeKey as CommitteeKey]?.firebaseDocName === committee.firebaseDocName
                );
                if (index !== -1) {
                    updatedCommittees.splice(index, 1);
                }
            } else {
                if (!updatedCommittees.some(
                    committeeKey => CommitteeConstants[committeeKey as CommitteeKey]?.firebaseDocName === committee.firebaseDocName
                )) {
                    updatedCommittees.push(committee.key as string);
                }
            }
        }

        updateMemberCountLocally();
        setCommittees(updatedCommittees);

        await setPublicUserData({
            ...(updatedCommittees !== undefined) && { committees: updatedCommittees },
        })
            .then(async () => {
                if (auth.currentUser?.uid) {
                    const firebaseUser = await getUser(auth.currentUser.uid);
                    if (firebaseUser) {
                        setUserInfo(firebaseUser);
                        await AsyncStorage.setItem("@user", JSON.stringify(firebaseUser));
                    }
                    else {
                        console.warn("firebaseUser returned as undefined when attempting to sync. Sync will be skipped.");
                    }
                }
            })
            .catch(err => console.error("Error attempting to save changes: ", err))
            .finally(() => {
                setLoading(false);
            });
    };

    const [lastPassTime, setLastPassTime] = useState(0) //hook

    const updateCommitteeCount = async () => {
        const currentTime = Date.now();

        if (currentTime - lastPassTime >= 10000) {
            updateUserCommittee(); //Don't update count if user cannot leave/join

            const updateCommitteeCount = httpsCallable(functions, 'updateCommitteeCount');

            setLastPassTime(currentTime) //update time

            try {
                await updateCommitteeCount({ committeeName: committee?.firebaseDocName, change: isInCommittee ? -1 : 1 });
            } catch (error) {
                console.error('Error calling function:', error);
            }
        }
        else {
            //add the user to watchlist here
            setWatchlist((await getWatchlist()).append(auth.currentUser?.uid!))
        }
    }

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
        <ScrollView style={{backgroundColor: committee.color}}>
            <SafeAreaView className='h-full pb-2' edges={['right', 'top', 'left']}>
                <TouchableHighlight className='py-3 px-6' onPress={() => navigation.goBack()} underlayColor="offwhite">
                    <Octicons name="chevron-left" size={30} color="black" />
                </TouchableHighlight>
                <View className='flex-auto items-center gap-4'>
                    <Text className='text-[32px] font-bold'>{committee.name}</Text>
                    <Image className='h-48 w-80 bg-white' source={committee.image || Images.COMMITTEE_4}/>
                    <Text className='text-lg pt-5 px-5'>{committeeInfo?.description || "No description provided"}</Text>
                    <View className='flex-row py-2'>
                        <Text className='text-3xl'>Members: </Text>
                        <Text className='text-4xl'>{committeeInfo ? committeeInfo.memberCount : "0"}</Text>
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
                            onPress={() => handleLinkPress(committeeInfo?.memberApplicationLink || '')}
                        >
                            <Text className='text-center text-[20px] font-medium'>Member Application</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='bg-white rounded-xl w-1/3 items-center justify-center border-gray-600 border'
                            onPress={() => handleLinkPress(committeeInfo?.leadApplicationLink || '')}
                        >
                            <Text className='text-center text-[20px] font-medium'>Lead Application</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View className='ml-6'>
                    <Text className='text-3xl font-semibold'>Officer</Text>
                    <UserProfile userInfo={headUserInfo}/>
                    <Text className='text-3xl font-semibold'>Leads</Text>
                    <FlatList
                        data={leadsUserInfo}
                        horizontal={true}
                        renderItem={({item, index}) => {
                            return(
                                <UserProfile userInfo={item} key={index}></UserProfile>
                            )
                        }}
                    />
                </View>

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
                                <View className='opacity-100 bg-white w-[70%] rounded-md items-center'>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setConfirmVisible(false)
                                            updateCommitteeCount()
                                        }}
                                    >
                                        <Text className='text-xl font-bold py-3 px-8'> {isInCommittee ? "Leave" : "Join"} </Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>

                    </TouchableOpacity>

                    <Text className='mt-3 mx-4'>{committeeInfo?.description}</Text>

                </Modal>
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
                                                setConfirmVisible(false)
                                                updateCommitteeCount()
                                            }}
                                            className="bg-pale-blue rounded-xl justify-center items-center"
                                        >
                                            <Text className='text-xl font-bold text-white px-8'> {isInCommittee ? "Leave" : "Join"} </Text>
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