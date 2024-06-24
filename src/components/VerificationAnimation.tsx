import { View, Animated, Easing, } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons'


type AnimationProps = {
    autoPlay?: boolean,
    loop?: boolean,
    duration?: number,
    onAnimationFinish?: ((isCancelled: boolean) => void)
};

const CheckmarkAnimation = ({ loop, duration, onAnimationFinish }: AnimationProps) => {
    const bubbleAnimation = useRef(new Animated.Value(0)).current;
    const ringAnimation = useRef(new Animated.Value(0)).current;

    duration = duration ? duration : 1000;

    const checkOpacity = bubbleAnimation.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [0, 0, 1]
    });

    const bubbleSize = bubbleAnimation.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [0.6, 0.4, 0.6]
    });

    const ringSize = ringAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
    });


    const animationFinishCallback = ({ finished }: Animated.EndResult) => {
        if (loop === false && onAnimationFinish) {
            onAnimationFinish(!finished);
        }
    }

    useEffect(() => {
        const bubbleSequence = Animated.sequence([
            Animated.timing(bubbleAnimation, {
                toValue: 1,
                duration: duration / 2,
                easing: Easing.elastic(1.2),
                useNativeDriver: true,
            }),
            Animated.timing(bubbleAnimation, {
                toValue: 1,
                duration: duration / 2,
                useNativeDriver: true,
            }),
        ]);

        const ringSequence = Animated.timing(ringAnimation, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
        });

        if (loop) {
            Animated.parallel([Animated.loop(bubbleSequence), Animated.loop(ringSequence)]).start();
        }
        else {
            Animated.parallel([bubbleSequence, ringSequence]).start(animationFinishCallback);
        }
    }, []);

    return (
        <>
            {/* Ripple */}
            <Animated.View />
            {/* Checkmark Circle */}
            <Animated.View
                style={{
                    transform: [{ scaleX: bubbleSize }, { scaleY: bubbleSize }]
                }}
                className='bg-green-500 rounded-full p-5'
            >
                <Animated.View style={{ opacity: checkOpacity }} className="">
                    <MaterialCommunityIcons name='check' size={100} color='white' />
                </Animated.View>
            </Animated.View>
        </>
    );
};

const RedXAnimation = ({ loop, onAnimationFinish }: AnimationProps) => {
    return (
        <Animated.View>

        </Animated.View>
    );
};

export type VerificationAnimationTypes = "check_animation" | "red_x_animation";

export const VerificationAnimation = ({ animation, autoPlay, loop, duration, onAnimationFinish }: { animation: VerificationAnimationTypes, autoPlay?: boolean, loop?: boolean, duration?: number, onAnimationFinish?: ((isCancelled: boolean) => void) }) => {
    const props: AnimationProps = { autoPlay, loop, duration, onAnimationFinish };

    switch (animation) {
        case "check_animation":
            return CheckmarkAnimation(props);
        case "red_x_animation":
        default:
            return RedXAnimation(props);
    }
};
