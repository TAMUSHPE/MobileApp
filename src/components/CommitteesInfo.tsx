import { View, Text, Image, Modal, TouchableOpacity, Linking, TouchableWithoutFeedback } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { Images } from '../../assets';
import { Committee, CommitteeKey } from '../types/Committees';
import { getCommitteeInfo, getPublicUserData, getUser, setPublicUserData } from '../api/firebaseUtils';
import { PublicUserInfo } from '../types/User';
import { CommitteesInfoProp } from '../types/Navigation';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { UserContext } from '../context/UserContext';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommitteeConstants } from '../types/Committees';
import { Octicons } from '@expo/vector-icons';

const CommitteesInfo: React.FC<CommitteesInfoProp> = ({ selectedCommittee, navigation }) => {
    if (!selectedCommittee) {
        return null; // replace with a proper empty screen
    }
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
            setIsInCommittee(firebaseDocNames?.includes(selectedCommittee.firebaseDocName!));
        }
    }, [committees, selectedCommittee.name]);

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
            if (selectedCommittee.name) {
                const fetchedInfo = await getCommitteeInfo(selectedCommittee.firebaseDocName!);
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
    }, [selectedCommittee.name]);


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
                    committeeKey => CommitteeConstants[committeeKey as CommitteeKey]?.firebaseDocName === selectedCommittee.firebaseDocName
                );
                if (index !== -1) {
                    updatedCommittees.splice(index, 1);
                }
            } else {
                if (!updatedCommittees.some(
                    committeeKey => CommitteeConstants[committeeKey as CommitteeKey]?.firebaseDocName === selectedCommittee.firebaseDocName
                )) {
                    updatedCommittees.push(selectedCommittee.key as string);
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

    const updateCommitteeCount = async () => {
        updateUserCommittee();

        const functions = getFunctions();
        const updateCommitteeCount = httpsCallable(functions, 'updateCommitteeCount');

        try {
            await updateCommitteeCount({ committeeName: selectedCommittee?.firebaseDocName, change: isInCommittee ? -1 : 1 });
        } catch (error) {
            console.error('Error calling function:', error);
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
        <View>
            <View className='flex-row justify-between mx-4 mt-10'>
                {/* Committee Image */}
                <View className='h-52 w-[40%] shadow-2xl rounded-3xl'>
                    <Image source={selectedCommittee?.image || Images.COMMITTEE_4} className='h-full w-full bg-pale-blue rounded-3xl' />
                    <View className='absolute items-center w-full'>
                        <Text className='text-lg font-bold'>{selectedCommittee?.name}</Text>
                    </View>
                </View>

                {/* Committee Info */}
                <View className='w-[60%]'>
                    <View className={`flex-row justify-between ${leadsUserInfo.length > 0 ? "mx-4" : "mx-10"} items-center`}>
                        <View className={`${leadsUserInfo.length > 0 ? "w-[1/3]" : "w-[1/2] "} items-center`}>
                            <Text>Head</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("PublicProfile", { uid: headUserInfo?.uid! })}
                            >

                                <Image source={headUserInfo?.photoURL ? { uri: headUserInfo?.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 mt-2 rounded-full' />
                            </TouchableOpacity>
                        </View>

                        {leadsUserInfo.length > 0 &&
                            <View className='w-[1/3] items-center'>
                                <Text>Lead</Text>
                                <View className='flex-row-reverse mt-2'>
                                    {leadsUserInfo.map((lead, index) => (
                                        <View className='w-4' key={index}>
                                            <TouchableOpacity
                                                onPress={() => navigation.navigate("PublicProfile", { uid: lead.uid! })}
                                            >
                                                <Image source={leadsUserInfo[index].photoURL ? { uri: leadsUserInfo[index].photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 rounded-full' />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                </View>
                            </View>
                        }

                        <View className={`${leadsUserInfo.length > 0 ? "w-[1/3]" : "w-[1/2]"} items-center h-full`}>
                            <Text>Members</Text>
                            <View className='mt-2'>
                                <Text className=''>{committeeInfo?.memberCount}</Text>
                            </View>
                        </View>

                    </View>

                    <Text className='mt-3 mx-4'>{committeeInfo?.description}</Text>

                </View>
            </View>

            <View className='flex-row mx-4 mt-4 space-x-2'>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[8%] items-center justify-center border-gray-600 border'
                    onPress={() => setConfirmVisible(!confirmVisible)}
                >
                    <Text>{isInCommittee ? "-" : "+"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[43%] items-center justify-center border-gray-600 border'
                    onPress={() => handleLinkPress(committeeInfo?.memberApplicationLink || '')}
                >
                    <Text>Member Application</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[43%] items-center justify-center border-gray-600 border'
                    onPress={() => handleLinkPress(committeeInfo?.leadApplicationLink || '')}
                >
                    <Text>Leader Application</Text>
                </TouchableOpacity>
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


        </View>
    )
}


export default CommitteesInfo