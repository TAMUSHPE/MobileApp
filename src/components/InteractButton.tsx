import { Image, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

const InteractButton = ({ pressFunction, label, buttonStyle, textStyle, iconStyle, opacity, iconURI }: { pressFunction: Function, label?: string, buttonStyle?: string, textStyle?: string, iconStyle?: string, opacity?: number, iconURI?: string }) => {
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
                <Text className={`p-2 ${textStyle ?? "text-black"}`}>{label ?? "Interact Button"}</Text>
            </View>
        );
    }
    else {
        content = (<Text className={`p-2 ${textStyle ?? "text-black"}`}>{label ?? "Interact Button"}</Text>);
    }

    return (
        <TouchableOpacity
            onPress={() => pressFunction()}
            className={`flex justify-center items-center ${buttonStyle ?? "bg-blue-300"}`}
            activeOpacity={opacity ?? 0.7}
        >
            {content}
        </TouchableOpacity>
    );
};

export default InteractButton;
