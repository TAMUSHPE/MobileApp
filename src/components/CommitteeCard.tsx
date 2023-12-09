import React, { useContext, useEffect, useState } from 'react'
import { View, Text, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { Committee } from "../types/Committees";
import { Images } from "../../assets"
import { PublicUserInfo } from '../types/User';
import { getPublicUserData } from '../api/firebaseUtils';

interface CommitteeCardProps {
    committee: Committee
    handleCardPress: (committee: Committee) => Committee | void;
}

const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee, handleCardPress }) => {
    const { name, color, image, head, leads } = committee;
    return (
        <TouchableOpacity onPress={() => handleCardPress(committee)}>
            <View className='flex-row justify-left mx-6 my-3'>
                <View className='flex-row h-full w-full rounded-2xl' style={{ backgroundColor: color }}>
                    <ImageBackground source={image || Images.COMMITTEE_4} className='h-28 w-36 rounded-2xl bg-pale-blue'>
                        <Text className='flex text-lg text-center font-bold'>{name}</Text>
                    </ImageBackground>
                    <View className='flex-row flex-1 justify-around items-center'>
                        <View className='items-center'>
                            <Text>Officer</Text>
                            <Image source={head?.photoURL ? { uri: head.photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 mt-2 rounded-full' />
                        </View>
                        {leads?.length != 0 ? (
                            <View className='items-center'>
                                <Text>Leads</Text>
                                <View className='items-center flex-row-reverse mt-2'>
                                    {leads && leads.map((lead, index) => (
                                        <View className='w-4' key={index}>
                                            <Image source={leads[index].photoURL ? { uri: leads[index].photoURL } : Images.DEFAULT_USER_PICTURE} className='h-8 w-8 rounded-full' />
                                        </View>
                                    ))}
                                </View>
                            </View>) : null}
                        <View className='items-center gap-2 pb-1'>
                            <Text>Members</Text>
                            <Text className='text-lg'>{"0"}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default CommitteeCard;