import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { Committee, CommitteeConstants } from "../types/Committees"
import { Images } from "../../assets"

const CommitteesSlider: React.FC<CommitteesSlideProp> = ({ onCommitteeSelected, selectedCommittee }) => {
    const committees: Committee[] = [
        {
            name: CommitteeConstants.TECHNICALAFFAIRS,
            image: Images.COMMITTEE_1,
        },
        {
            name: CommitteeConstants.PUBLICRELATIONS,
            image: Images.COMMITTEE_2,
        },
        {
            name: CommitteeConstants.MENTORSHPE,
            image: Images.COMMITTEE_3,
        },
        {
            name: CommitteeConstants.SCHOLASTIC,
            image: Images.COMMITTEE_4,
        },
    ]

    return (
        <ScrollView
            horizontal={true}
            className='space-x-7 mx-4 mt-4'
            showsHorizontalScrollIndicator={false}
        >
            {committees.map((committee) => {
                if (committee.name === selectedCommittee?.name) {
                    return null;
                }
                return (
                    <TouchableOpacity
                        key={committee.name}
                        onPress={() => onCommitteeSelected(committee)}
                    >
                        <View className='w-36 h-60'>
                            <View className='h-52 ounded-3xl'>
                                <Image source={committee.image || Images.COMMITTEE_4} className='h-full w-full bg-pale-blue rounded-3xl' />
                            </View>
                            <View className='w-full items-center absolute mt-1'>
                                <Text className='text-lg font-bold'>{committee.name}</Text>
                            </View>
                            {/* <View className='flex-row-reverse bottom-5 left-3 absolute mt-1'>
                                <View className='w-6'>
                                    <Image source={Images.DEFAULT_USER_PICTURE} className='h-9 w-9 rounded-full' />
                                </View>
                                <View className='w-6'>
                                    <Image source={Images.DEFAULT_USER_PICTURE} className='h-9 w-9 rounded-full' />
                                </View>
                                <View className='w-6'>
                                    <Image source={Images.DEFAULT_USER_PICTURE} className='h-9 w-9 rounded-full' />
                                </View>
                            </View> */}
                        </View>
                    </TouchableOpacity>
                )
            })}
        </ScrollView>
    )
}


type CommitteesSlideProp = {
    onCommitteeSelected: (item: Committee) => void;
    selectedCommittee: Committee | null;
}


export default CommitteesSlider