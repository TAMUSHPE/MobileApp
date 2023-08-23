import { Image, Text, TouchableHighlight, View } from 'react-native';
import React from 'react';

/**
 * Template for a button that 
 * @param onPress - Function to be called when button is pressed
 * @param label - Text to be displayed on the button
 * @param buttonClassName - Text to be displayed on the button
 * @returns Component which 
 */
const InteractButton = ({ onPress, label, buttonClassName, textClassName, iconStyle, opacity, iconURI, underlayColor, customContent }: { onPress: Function, label?: string, buttonClassName?: string, textClassName?: string, iconStyle?: string, opacity?: number, iconURI?: string, underlayColor?: string, customContent?: React.JSX.Element }) => {
    let content;
    if (customContent) {
        content = customContent
    }
    else if (iconURI) {
        content = (
            <View className='flex-row justify-center items-center'>
                <Image
                    className={`${iconStyle ?? "w-6 h-6"}`}
                    source={{
                        uri: iconURI
                    }}
                />
                <Text className={`p-2 ${textClassName ?? "text-black"}`}>{label ?? "Interact Button"}</Text>
            </View>
        );
    }
    else {
        content = (<Text className={`p-2 ${textClassName ?? "text-black"}`}>{label ?? "Interact Button"}</Text>);
    }

    return (
        <TouchableHighlight
            onPress={() => onPress()}
            className={`flex ${buttonClassName ?? "justify-center items-center bg-blue-300"}`}
            activeOpacity={opacity ?? 0.7}
            underlayColor={underlayColor ?? "#DDD"}
        >
            {content}
        </TouchableHighlight>
    );
};

export default InteractButton;
