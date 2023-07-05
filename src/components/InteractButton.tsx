import { Text, TouchableOpacity } from 'react-native';
import React from 'react';

const InteractButton = ({ pressFunction, buttonColor, textColor, label, buttonClassName }: { pressFunction: Function, label?: string, buttonColor?: string, textColor?: string, buttonClassName?: string }) => {
    var buttonColorStyle: string;
    var textColorStyle: string;
    
    switch(buttonColor){
        case "blue":
            buttonColorStyle = "bg-blue-500";
            break;
        case "gray":
            buttonColorStyle = "bg-[#dddddd]";
            break;
        default:
            buttonColorStyle="bg-blue-500";
    }

    switch(textColor){
        case "white":
            textColorStyle = "text-white";
            break;
        case "gray":
            textColorStyle = "text-[#3b3b3b]";
            break;
        case "black":
            textColorStyle = "text-black";
            break;
        default:
            textColorStyle="text-white";
    }
    
    return (
        <TouchableOpacity
            onPress={() => pressFunction()}
            className={`flex justify-center items-center p-2 rounded-md ${buttonColorStyle} ${buttonClassName ?? ""}`}
            activeOpacity={0.7}
        >
            <Text className={`font-bold ${textColorStyle}`}>{label ?? ""}</Text>
        </TouchableOpacity>
    );
};

export default InteractButton;
