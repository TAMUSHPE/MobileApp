import React, { useState, ReactElement } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InvolvementStackParams } from '../../types/Navigation';
import CommitteesList from './CommitteesList';
import MemberSHPE from './MemberSHPE';

// Define tab components

const Involvement: React.FC<NativeStackScreenProps<InvolvementStackParams>> = ({ navigation }) => {
    const [currentTab, setCurrentTab] = useState<keyof typeof TABS>("Committees");
    const tabComponents: Record<string, ReactElement> = {
        Committees: <CommitteesList navigation={navigation} />,
        MemberSHPE: <MemberSHPE />,
    };

    return (
        <View className='h-full'>
            {/* Top Nav Bar */}
            <SafeAreaView>
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
            </SafeAreaView>

            {/* Content */}
            <View className='flex-1'>
                {tabComponents[currentTab]}
            </View>
        </View>
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
