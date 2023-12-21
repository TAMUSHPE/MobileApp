import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { InvolvementStackParams } from '../../types/Navigation'
import CommitteesList from './CommitteesList'
import MemberSHPE from './MemberSHPE'


const Involvement = ({ navigation }: NativeStackScreenProps<InvolvementStackParams>) => {
    const [currentTab, setCurrentTab] = useState<InvolvementTabs>("Committees")

    return (
        <View>
            {/* Top Nav Bar */}
            <SafeAreaView>
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
            </SafeAreaView>

            {/* Content */}
            <View>
                {currentTab === "Committees" && <CommitteesList navigation={navigation} />}
                {currentTab === "MemberSHPE" && <MemberSHPE />}
            </View>

        </View>
    )
}

type InvolvementTabs = "Committees" | "MemberSHPE"

export default Involvement