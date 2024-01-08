import React, { useState, ReactElement } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InvolvementScreenProps } from '../../types/Navigation';
import CommitteesList from './CommitteesList';
import MemberSHPE from './MemberSHPE';


const Involvement: React.FC<InvolvementScreenProps> = ({ navigation }) => {
    const [currentTab, setCurrentTab] = useState<keyof typeof TABS>("Committees");
    const tabComponents: Record<string, ReactElement> = {
        Committees: <CommitteesList navigation={navigation} />,
        MemberSHPE: <MemberSHPE />,
    };

    return (
        <SafeAreaView className='flex-1' edges={["top"]}>
            <View>
                <View className='flex flex-row justify-between items-center mx-16 mt-4'>
                    {Object.entries(TABS).map(([key, label]) => (
                        <NavigationTab
                            key={key}
                            label={label}
                            isActive={currentTab === key}
                            onPress={() => setCurrentTab(key as keyof typeof TABS)}
                        />
                    ))}
                </View>
            </View>

            {/* Content */}
            <View className='flex-1'>
                {tabComponents[currentTab]}
            </View>
        </SafeAreaView>
    )
}

const NavigationTab: React.FC<NavigationTabProps> = ({ label, isActive, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <Text className={`font-semibold text-xl ${isActive && "text-pale-blue"}`}>{label}</Text>
    </TouchableOpacity>
);

interface NavigationTabProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
}

const TABS = {
    Committees: 'Committees',
    MemberSHPE: 'MemberSHPE',
};

export default Involvement;
