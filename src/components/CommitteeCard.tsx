import React, { useContext, useEffect, useState } from 'react'
import { View, Text, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { Committee } from "../types/Committees";
import { Images } from "../../assets"
import { PublicUserInfo } from '../types/User';
import { getCommitteeInfo, getPublicUserData} from '../api/firebaseUtils';

interface CommitteeCardProps {
    committee: Committee
    handleCardPress: (committee: Committee) => Committee | void;
}

const CommitteeCard: React.FC<CommitteeCardProps> = ({committee, handleCardPress}) =>{
    const [committeeInfo, setCommitteeInfo] = useState<Committee | null>(null);
    const [officerUserInfo, setOfficerUserInfo] = useState<PublicUserInfo | null>(null);
    const [leadsUserInfo, setLeadsUserInfo] = useState<PublicUserInfo[]>([]);

    useEffect(() => {
        const fetchHeadUserData = async (uid: string) => {
            const fetchedInfo = await getPublicUserData(uid);
            if (fetchedInfo) {
                setOfficerUserInfo({
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
            setOfficerUserInfo(null);
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

    return(
        <TouchableOpacity onPress={() => handleCardPress(committee)}>
            <View className='flex-row justify-left mx-6 my-3'>
                    <View className='flex-row h-full w-full rounded-2xl' style={{backgroundColor: committee.color}}>
                        <ImageBackground source={committee.image || Images.COMMITTEE_4} className='h-28 w-36 rounded-2xl bg-pale-blue'>
                            <Text className='flex text-lg text-center font-bold'>{committee.name}</Text>
                        </ImageBackground>
                        <View className='flex-row flex-1 justify-around items-center'>
                            <View className='items-center'>
                                <Text>Officer</Text>
                                <Image source={officerUserInfo?.photoURL ? { uri: officerUserInfo?.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 mt-2 rounded-full' />
                            </View>
                            {leadsUserInfo.length != 0 ? (
                            <View className='items-center'>
                                <Text>Leads</Text>
                                <View className='items-center flex-row-reverse mt-2'>
                                    {leadsUserInfo.map((lead, index) => (
                                        <View className='w-4' key={index}>
                                            <Image source={leadsUserInfo[index].photoURL ? { uri: leadsUserInfo[index].photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 rounded-full' />
                                        </View>
                                    ))}
                                </View>
                            </View>) : null}
                            <View className='items-center gap-2 pb-1'>
                                <Text>Members</Text>
                                <Text className='text-lg'>{committeeInfo ? committeeInfo.memberCount : "0"}</Text>
                            </View>
                        </View>
                    </View>
            </View>
        </TouchableOpacity>
    );
};

export default CommitteeCard;