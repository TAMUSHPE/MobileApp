import { Text, TouchableOpacity } from 'react-native';
import React from 'react';

const InteractButton = ({ pressFunction, label, buttonStyle, textStyle, opacity }: { pressFunction: Function, label?: string, buttonStyle?: string, textStyle?: string, opacity?: number }) => {
    return (
        <TouchableOpacity
            onPress={() => pressFunction()}
            className={`flex justify-center items-center ${buttonStyle ?? "bg-blue-300"}`}
            activeOpacity={opacity ?? 0.7}
        >
            <Text className={`p-2 ${textStyle ?? "text-black"}`}>{label ?? "Interact Button"}</Text>
        </TouchableOpacity>
    );
};

export default InteractButton;
