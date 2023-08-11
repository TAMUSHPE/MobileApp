import { View, Text } from 'react-native';
import React from 'react';

/**
 * 
 * @param text
 * The text to be displayed on the badge.
 * @param badgeStyle
 * Style of the badge surrounding text.
 * 
 * Default: "px-2 py-1 bg-slate-600 rounded-full inline-block mr-1 mb-1"
 * @param textStyle
 * Style of the text element in the badge.
 * 
 * Default: "text-white text-center"
 * @returns 
 */
const ProfileBadge = ({ text, badgeStyle, textStyle }: { text?: string, badgeStyle?: string, textStyle?: string }) => {
    return (
        <View className={badgeStyle ?? "px-2 py-1 bg-slate-600 rounded-full inline-block mr-1 mb-1"}>
            <Text className={textStyle ?? "text-white text-center"}>{text ?? "Default Text"}</Text>
        </View>
    );
};

export default ProfileBadge;
