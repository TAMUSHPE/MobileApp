import { Image, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

/**
 * Template for a button that 
 * @param onPress - Function to be called when button is pressed
 * @param label - Text to be displayed on the button
 * @param buttonClassName - Text to be displayed on the button
 * @returns Component which 
 */
const InteractButton = ({ onPress, label, buttonClassName, textClassName, iconStyle, opacity, iconURI }: { onPress: Function, label?: string, buttonClassName?: string, textClassName?: string, iconStyle?: string, opacity?: number, iconURI?: string }) => {
    let content;
    if (iconURI) {
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
        <TouchableOpacity
            onPress={() => onPress()}
            className={`flex justify-center items-center ${buttonClassName ?? "bg-blue-300"}`}
            activeOpacity={opacity ?? 0.7}
        >
            {content}
        </TouchableOpacity>
    );
};

export default InteractButton;
