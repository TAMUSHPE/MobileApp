import { View, Text, Animated, TextInput } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

type TextInputWithFloatingTitleProps = {
    setTextFunction: (text: string) => any,
    inputValue: string | undefined,
    title?: string,
    titleStartY?: number,
    titleEndY?: number,
    componentClassName?: string,
    textInputClassName?: string,
    titleClassName?: string,
    focusTitleClassName?: string,
    blurTitleClassName?: string,
    placeholderText?: string,
    maxCharacters?: number,
    lineCount?: number,
    isMultiline?: boolean,
    secureTextEntry?: boolean;
    onSubmitEditing?: () => void;
}

const TextInputWithFloatingTitle = ({ setTextFunction, inputValue, title, titleStartY, titleEndY, componentClassName, textInputClassName, titleClassName, focusTitleClassName, blurTitleClassName, placeholderText, maxCharacters, lineCount, isMultiline, secureTextEntry, onSubmitEditing }: TextInputWithFloatingTitleProps) => {
    const [currentTitleClassName, setCurrentTitleClassName] = useState<string | undefined>(titleClassName ?? blurTitleClassName ?? "");
    const moveTitle = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (inputValue !== "") {
            moveTitleTop();
            setCurrentTitleClassName(titleClassName ? titleClassName : focusTitleClassName);
        }
        else {
            moveTitleBottom();
            setCurrentTitleClassName(titleClassName ? titleClassName : blurTitleClassName);
        }
    });

    const moveTitleTop = () => {
        Animated.timing(moveTitle, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    }

    const moveTitleBottom = () => {
        Animated.timing(moveTitle, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start();
    }

    const yVal = moveTitle.interpolate({
        inputRange: [0, 1],
        outputRange: [titleStartY ?? 20, titleEndY ?? 0]
    });

    const textInputStyle = {
        textAlignVertical: isMultiline ? 'top' : 'center' as 'top' | 'center',
    };

    return (
        <View className={componentClassName}>
            <Animated.View style={{
                transform: [{ translateY: yVal }],
            }}>
                <Text className={currentTitleClassName}>{title ?? "Title"}</Text>
            </Animated.View>
            <TextInput
                style={textInputStyle}
                placeholder={placeholderText ?? ""}
                className={textInputClassName ?? ""}
                multiline={isMultiline ?? false}
                value={inputValue ?? ""}
                numberOfLines={lineCount ?? 1}
                maxLength={maxCharacters ?? 64}
                onChangeText={(text: string) => {
                    setTextFunction(text);
                }}

                secureTextEntry={secureTextEntry}
                onSubmitEditing={onSubmitEditing}
            />
        </View>
    );
};

export default TextInputWithFloatingTitle;
