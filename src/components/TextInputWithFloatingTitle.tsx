import { View, Text, Animated, TextInput } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

const TextInputWithFloatingTitle = ({ setTextFunction, inputValue, title, titleStartY, titleEndY, componentClassName, textInputClassName, focusTextClassName, blurTextClassName, placeholderText, maxCharacters, lineCount, isMultiline }: { setTextFunction: (text: string) => any, inputValue: string | undefined, title?: string, titleStartY?: number, titleEndY?: number, componentClassName?: string, textInputClassName?: string, focusTextClassName?: string, blurTextClassName?: string, placeholderText?: string, maxCharacters?: number, lineCount?: number, isMultiline?: boolean }) => {
    const [titleClassName, setTitleClassName] = useState<string | undefined>(blurTextClassName ?? "");
    const moveTitle = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (inputValue !== "") {
            moveTitleTop();
            setTitleClassName(focusTextClassName);
        }
        else {
            moveTitleBottom();
            setTitleClassName(blurTextClassName);
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
        outputRange: [titleStartY ?? 0, titleEndY ?? 0]
    });

    return (
        <View className={componentClassName}>
            <Animated.View style={{
                transform: [{ translateY: yVal }],
            }}>
                <Text className={titleClassName}>{title ?? "Title"}</Text>
            </Animated.View>
            <TextInput
                placeholder={placeholderText ?? ""}
                className={textInputClassName ?? ""}
                multiline={isMultiline ?? false}
                value={inputValue ?? ""}
                numberOfLines={lineCount ?? 1}
                maxLength={maxCharacters ?? 64}
                onChangeText={(text: string) => {
                    setTextFunction(text);
                }}
            />
        </View>
    );
};

export default TextInputWithFloatingTitle;
