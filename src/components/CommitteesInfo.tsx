import { View, Text, Image, TouchableOpacity, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Images } from '../../assets';
import { Committee } from '../types/Committees';
import { getCommitteeInfo, getPublicUserData } from '../api/firebaseUtils';
import { PublicUserInfoUID } from '../types/User';
import { CommitteesInfoProp } from '../types/Navigation';

const CommitteesInfo: React.FC<CommitteesInfoProp> = ({ selectedCommittee, navigation }) => {
    if (!selectedCommittee) {
        return null; // replace with a proper empty screen
    }
    const [committeeInfo, setCommitteeInfo] = useState<Committee | null>(null);
    const [headUserInfo, setHeadUserInfo] = useState<PublicUserInfoUID | null>(null);
    const [leadsUserInfo, setLeadsUserInfo] = useState<PublicUserInfoUID[]>([]);

    useEffect(() => {
        const fetchCommitteeInfo = async () => {
            setCommitteeInfo(null);
            setHeadUserInfo(null);
            setLeadsUserInfo([]);

            if (selectedCommittee.name) {
                const fetchedInfo = await getCommitteeInfo(selectedCommittee.name);
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

        fetchCommitteeInfo();
    }, [selectedCommittee.name]);

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
                >
                    <Text>+</Text>
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

        </View>
    )
}


export default CommitteesInfo