import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { MemberListProps } from '../types/Navigation'
import MemberCard from './MemberCard'

const MembersList: React.FC<MemberListProps> = ({ handleCardPress, users, navigation }) => {
    return (
        <View className='px-5 flex-1'>
            <ScrollView>
                {users?.map((userData, index) => {
                    if (!userData.name) {
                        return null;
                    }
                    return (
                        <MemberCard
                            key={index}
                            userData={userData}
                            navigation={navigation}
                            handleCardPress={() => handleCardPress(userData.uid!)}
                        />
                    );
                })}
            </ScrollView>
        </View>
    )
}

export default MembersList