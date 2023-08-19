import { View, Text } from 'react-native';
import React from 'react';
import { validateHexColor, calculateHexLuminosity } from '../helpers/colorUtils';

/**
 * Renders a badge with the provided text and styles.
 *
 * @param text - The text to be displayed on the badge.
 * @param badgeStyle - Style of the badge surrounding text. Default: "px-2 py-1 bg-slate-600 rounded-full inline-block mr-1 mb-1".
 * @param badgeColor - Hex code for color of badge background.
 * @param textStyle - Style of the text element in the badge. Default: "text-white text-center".
 * @param textColor - Hex code for color of badge text.
 * @returns The rendered badge component.
 */
const ProfileBadge = ({ text, badgeStyle, badgeColor, textStyle, textColor }: { text?: string, badgeStyle?: string, badgeColor?: string, textStyle?: string, textColor?: string }) => {
    const defaultBadgeColor = "#7777AA";
    const badgeLuminosity = calculateHexLuminosity(badgeColor ?? defaultBadgeColor);
    return (
        <View className={badgeStyle ?? "px-2 py-1 rounded-full inline-block mr-1 mb-1"} style={{ backgroundColor: validateHexColor(badgeColor ?? "") ? badgeColor : defaultBadgeColor }}>
            <Text className={textStyle ?? "text-center"} style={{ color: textColor ? textColor : (badgeLuminosity > 180 ? "#000" : "#FFF") }}>{text ?? "Default Text"}</Text>
        </View>
    );
};

export default ProfileBadge;
