import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CommitteesList from '../components/CommitteesList'
import MemberSHPE from '../components/MemberSHPE'
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
                    <Text className={`font-semibold text-xl ${currentTab === "Committees" && "text-pale-blue"}`}>Committees</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setCurrentTab("MemberSHPE")}
                >
                    <Text className={`font-semibold text-xl ${currentTab === "MemberSHPE" && "text-pale-blue"}`}>MemberSHPE</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className='mt-8'>
                {currentTab === "Committees" && <CommitteesList navigation={navigation} />}
                {currentTab === "MemberSHPE" && <MemberSHPE />}
            </View>

        </SafeAreaView>
    )
}

export default Involvement