import { View, Text } from 'react-native';
import React from 'react';

const ProfileBadge = ({ text, badgeStyle, textStyle }: { text?: string, badgeStyle?: string, textStyle?: string }) => {
    return (
        <View className={badgeStyle ?? "px-2 py-1 bg-slate-600 rounded-full inline-block mr-1"}>
            <Text className={textStyle ?? "text-white text-center"}>{text ?? "Default Text"}</Text>
        </View>
    );
};

export default ProfileBadge;
