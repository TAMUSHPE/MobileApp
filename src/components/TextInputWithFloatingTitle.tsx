import { View, Text, Animated, TextInput } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

const TextInputWithFloatingTitle = ({ setTextFunction, inputValue, title, titleStartY, titleEndY, componentStyle, textInputStyle, focusTextStyle, blurTextStyle, placeholderText, maxCharacters, lineCount, isMultiline }: { setTextFunction: Function, inputValue: string | undefined, title?: string, titleStartY?: number, titleEndY?: number, componentStyle?: string, textInputStyle?: string, focusTextStyle?: string, blurTextStyle?: string, placeholderText?: string, maxCharacters?: number, lineCount?: number, isMultiline?: boolean }) => {
    const [titleStyle, setTitleStyle] = useState<string | undefined>(blurTextStyle ?? "");
    const moveTitle = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (inputValue !== "") {
            moveTitleTop();
            setTitleStyle(focusTextStyle);
        }
        else {
            moveTitleBottom();
            setTitleStyle(blurTextStyle);
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
        <View className={componentStyle}>
            <Animated.View style={{
                transform: [{ translateY: yVal }],
            }}>
                <Text className={titleStyle}>{title ?? "Title"}</Text>
            </Animated.View>
            <TextInput
                placeholder={placeholderText ?? ""}
                className={textInputStyle ?? ""}
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
