import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CommitteesTab from '../components/CommitteesTab'
import MemberSHPETab from '../components/MemberSHPETab'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { InvolvementStackParams } from '../types/Navigation'

type InvolvementTabs = "Committees" | "MemberSHPE"


const Involvement = ({ navigation }: NativeStackScreenProps<InvolvementStackParams>) => {
    const [currentTab, setCurrentTab] = useState<InvolvementTabs>("Committees")

    return (
        <SafeAreaView>
            {/* Bar */}
            <View className='flex flex-row justify-between items-center mx-16 mt-4'>
                <TouchableOpacity
                    onPress={() => setCurrentTab("Committees")}
                >
                    <Text className={`font-semibold text-lg ${currentTab === "Committees" && "text-[#72A9BE]"}`}>Committees</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setCurrentTab("MemberSHPE")}
                >
                    <Text className={`font-semibold text-lg ${currentTab === "MemberSHPE" && "text-[#72A9BE]"}`}>MemberSHPE</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {currentTab === "Committees" && <CommitteesTab navigation={navigation} />}
            {currentTab === "MemberSHPE" && <MemberSHPETab />}

        </SafeAreaView>
    )
}

export default Involvement