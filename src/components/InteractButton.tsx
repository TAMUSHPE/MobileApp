import { Image, ImageSourcePropType, Text, TouchableHighlight, View } from 'react-native';
import React from 'react';

type InteractButtonProps = {
    onPress: Function,
    label?: string,
    buttonClassName?: string,
    textClassName?: string,
    iconStyle?: string,
    opacity?: number,
    iconSource?: ImageSourcePropType,
    underlayColor?: string,
    customContent?: React.JSX.Element
}

/**
 * Template for a button that 
 * @param onPress - Function to be called when button is pressed
 * @param label - Text to be displayed on the button
 * @param buttonClassName - Class of TouchableHighlight wrapping text 
 * @param textClassName - Class of text element wrapped in TouchableHighlight 
 * @param iconSource - Source of icon to be used for the button. Icon will be on the left of the text.
 * @param opacity - How opaque the wrapped elements will be when the button is pressed from 0-1. 0 is completely transparent and 1 is fully opaque.
 * @param underlayColor - Color which button will use for background once pressed. Defaults to #DDD
 * @param customContent - Custom JSX to be used as content within the button replacing the default content. Note that when using this, it may be better to simply use a TouchableHighlight element.
 * @returns Component which 
 */
const InteractButton = ({ onPress, label, buttonClassName, textClassName, iconSource, iconStyle, opacity, underlayColor, customContent }: InteractButtonProps) => {
    let content;
    if (customContent) {
        content = customContent
    }
    else if (iconSource) {
        content = (
            <View className='flex-row justify-center items-center'>
                <Image
                    className={`${iconStyle ?? "w-6 h-6"}`}
                    source={iconSource}
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
