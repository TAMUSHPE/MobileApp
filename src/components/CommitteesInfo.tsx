import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Images } from '../../assets';
import { Committee } from '../types/Committees';
import { getCommitteeInfo, getPublicUserData } from '../api/firebaseUtils';
import { PublicUserInfo } from '../types/User';

const CommitteesInfo: React.FC<CommitteesInfoProp> = ({ selectedCommittee }) => {
    if (!selectedCommittee) {
        return null; // replace with a proper empty screen
    }
    const [committeeInfo, setCommitteeInfo] = useState<Committee | null>(null);
    const [headUserInfo, setHeadUserInfo] = useState<PublicUserInfo | null>(null);
    const [leadsUserInfo, setLeadsUserInfo] = useState<PublicUserInfo[]>([]);

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
                setHeadUserInfo(fetchedInfo);
            }
        };

        const fetchLeadUserData = async (uid: string) => {
            const fetchedInfo = await getPublicUserData(uid);
            if (fetchedInfo) {
                setLeadsUserInfo(prevState => [...prevState, fetchedInfo]);
            }
        }

        fetchCommitteeInfo();
    }, [selectedCommittee.name]);

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
                    <View className='flex-row justify-between mx-4 items-center'>
                        <View className='w-[1/3] items-center'>
                            <Text>Head</Text>
                            <Image source={headUserInfo?.photoURL ? { uri: headUserInfo?.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 mt-2 rounded-full' />
                        </View>

                        <View className='w-[1/3] items-center'>
                            {leadsUserInfo.length > 0 && <Text>Lead</Text>}
                            <View className='flex-row-reverse mt-2'>
                                {leadsUserInfo.map((lead, index) => (
                                    <View className='w-4 '>
                                        <Image source={leadsUserInfo[index].photoURL ? { uri: leadsUserInfo[index].photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 rounded-full' />
                                    </View>
                                ))}

                            </View>
                        </View>

                        <View className='w-[1/3] items-center h-full'>
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
                >
                    <Text>Member Application</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='bg-white rounded-xl h-8 w-[43%] items-center justify-center border-gray-600 border'
                >
                    <Text>Leader Application</Text>
                </TouchableOpacity>
            </View>

        </View>
    )
}

type CommitteesInfoProp = {
    selectedCommittee: Committee | null;
}

export default CommitteesInfo