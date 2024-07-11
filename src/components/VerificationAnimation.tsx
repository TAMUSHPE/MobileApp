import { View, Animated, Easing, } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons'


type AnimationProps = {
    autoPlay?: boolean,
    loop?: boolean,
    duration?: number,
    onAnimationFinish?: ((isCancelled: boolean) => void)
};

const CheckmarkAnimation = ({ loop, duration, onAnimationFinish }: AnimationProps): React.JSX.Element => {
    const bubbleAnimation = useRef(new Animated.Value(1.0)).current;
    const ringAnimation = useRef(new Animated.Value(0)).current;

    duration = duration ? duration : 1800;

    const checkOpacity = bubbleAnimation.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0, 0, 1]
    });

    const bubbleSize = bubbleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.05, 0.6]
    });

    const ringSize = ringAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1.1]
    });

    const ringOpacity = ringAnimation.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0]
    });

    const animationFinishCallback = ({ finished }: Animated.EndResult) => {
        if (loop === false && onAnimationFinish) {
            onAnimationFinish(!finished);
        }
    }

    useEffect(() => {
        const bubbleSequence = Animated.sequence([
            Animated.timing(bubbleAnimation, {
                toValue: 0,
                duration: duration / 4,
                easing: Easing.elastic(0.1),
                useNativeDriver: true,
            }),
            Animated.timing(bubbleAnimation, {
                toValue: 1,
                duration: duration / 2,
                easing: Easing.elastic(2.0),
                useNativeDriver: true,
            }),
            Animated.timing(bubbleAnimation, {
                toValue: 1,
                duration: duration / 4,
                easing: Easing.elastic(2.0),
                useNativeDriver: true,
            }),
        ]);

        const ringSequence = Animated.sequence([
            Animated.timing(ringAnimation, {
                toValue: 0,
                duration: duration / 4,
                useNativeDriver: true,
            }),
            Animated.timing(ringAnimation, {
                toValue: 1,
                duration: duration / 4,
                easing: Easing.bezier(0.19, 1.0, 0.22, 1.0),
                useNativeDriver: true,
            }),
            Animated.timing(ringAnimation, {
                toValue: 1,
                duration: duration / 2,
                useNativeDriver: true,
            }),
        ]);

        if (loop) {
            Animated.parallel([Animated.loop(bubbleSequence), Animated.loop(ringSequence)]).start();
        }
        else {
            Animated.parallel([bubbleSequence, ringSequence]).start(animationFinishCallback);
        }
    }, []);

    return (
        <View className='relative'>
            {/* Ring */}
            <Animated.View
                style={{
                    transform: [{ scaleX: ringSize }, { scaleY: ringSize }],
                    opacity: ringOpacity
                }}
                className='border-green-500 border-4 rounded-full p-5 absolute left-0 right-0 top-0 bottom-0 m-auto'
            />
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
        </View>
    );
};

const RedXAnimation = ({ loop, duration, onAnimationFinish }: AnimationProps): React.JSX.Element => {
    const bubbleAnimation = useRef(new Animated.Value(0)).current;
    const bubbleHorizontalAnimation = useRef(new Animated.Value(0.5)).current;
    const ringAnimation = useRef(new Animated.Value(0)).current;

    duration = duration ? duration : 1800;

    const bubbleXPosition = bubbleHorizontalAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 20]
    });

    const bubbleSize = bubbleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.05, 0.6]
    });

    const xSize = bubbleAnimation.interpolate({
        inputRange: [0, 0.6, 1, 1.4],
        outputRange: [0, 0, 1, 1.2]
    });

    const ringSize = ringAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1.1]
    });

    const ringOpacity = ringAnimation.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0]
    });

    const animationFinishCallback = ({ finished }: Animated.EndResult) => {
        if (loop === false && onAnimationFinish) {
            onAnimationFinish(!finished);
        }
    }

    useEffect(() => {
        const bubbleSequence = Animated.sequence([
            Animated.timing(bubbleAnimation, {
                toValue: 1.4,
                duration: duration / 4,
                easing: Easing.bezier(0.165, 0.84, 0.44, 1.0),
                useNativeDriver: true,
            }),
            Animated.timing(bubbleAnimation, {
                toValue: 1,
                duration: duration / 8,
                useNativeDriver: true,
            }),
            Animated.timing(bubbleHorizontalAnimation, {
                toValue: 1,
                duration: duration / 8,
                useNativeDriver: true,
            }),
            Animated.timing(bubbleHorizontalAnimation, {
                toValue: 0,
                duration: duration / 8,
                useNativeDriver: true,
            }),
            Animated.timing(bubbleHorizontalAnimation, {
                toValue: 0.5,
                duration: duration / 8,
                useNativeDriver: true,
            }),
            Animated.timing(bubbleHorizontalAnimation, {
                toValue: 0.5,
                duration: duration / 4,
                useNativeDriver: true,
            }),
        ]);

        const ringSequence = Animated.sequence([
            Animated.timing(ringAnimation, {
                toValue: 0,
                duration: duration / 4,
                useNativeDriver: true,
            }),
            Animated.timing(ringAnimation, {
                toValue: 1,
                duration: duration / 4,
                easing: Easing.bezier(0.19, 1.0, 0.22, 1.0),
                useNativeDriver: true,
            }),
            Animated.timing(ringAnimation, {
                toValue: 1,
                duration: duration / 2,
                useNativeDriver: true,
            }),
        ]);

        if (loop) {
            Animated.parallel([Animated.loop(bubbleSequence), Animated.loop(ringSequence)]).start();
        }
        else {
            Animated.parallel([bubbleSequence, ringSequence]).start(animationFinishCallback);
        }
    }, []);

    return (
        <View>
            {/* Ring */}
            <Animated.View
                style={{
                    transform: [{ scaleX: ringSize }, { scaleY: ringSize }],
                    opacity: ringOpacity
                }}
                className='border-red-500 border-4 rounded-full p-5 absolute left-0 right-0 top-0 bottom-0 m-auto'
            />
            {/* Red X Bubble */}
            <Animated.View
                style={{
                    transform: [{ scaleX: bubbleSize }, { scaleY: bubbleSize }, { translateX: bubbleXPosition }],
                }}
                className='bg-red-500 rounded-full p-5'
            >
                <Animated.View style={{
                    transform: [{ scaleX: xSize }, { scaleY: xSize }],
                }} className="">
                    <MaterialCommunityIcons name='close' size={100} color='white' />
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const QuestionMarkAnimation = ({ loop, duration, onAnimationFinish }: AnimationProps): React.JSX.Element => {
    const bubbleAnimation = useRef(new Animated.Value(0)).current;

    const bubbleRotation = bubbleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    duration = duration ? duration : 1800;

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
                easing: Easing.elastic(1.0),
                useNativeDriver: true,
            }),
            Animated.timing(bubbleAnimation, {
                toValue: 1,
                duration: duration / 2,
                useNativeDriver: true,
            }),
        ]);

        if (loop) {
            Animated.loop(bubbleSequence).start();
        }
        else {
            bubbleSequence.start(animationFinishCallback);
        }
    }, []);

    return (
        <Animated.View
            style={{
                transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }, { rotateZ: bubbleRotation }]
            }}
            className='bg-neutral-500 rounded-full p-5'
        >
            <MaterialCommunityIcons name="help" size={100} color='white' />
        </Animated.View>
    );
}

export type VerificationAnimationTypes = "check_animation" | "red_x_animation" | "question_mark_animation";

/**
 * Animation used for when something has been verified. This mainly used when the user signs in/out of an event. 
 * 
 * @param animation Selected animation. This will default to a spinning question mark if animation is not specified
 * @param loop Animation will repeat immediately after finishing. Default is false.
 * @param duration How long the animation will last in milliseconds. This is 1800 milliseconds by default
 * @param onAnimationFinish Callback function when animation finishes. This only works when the animation does not loop.
 */
export const VerificationAnimation = ({ animation, loop, duration, onAnimationFinish }: { animation?: VerificationAnimationTypes, loop?: boolean, duration?: number, onAnimationFinish?: ((isCancelled: boolean) => void) }): React.JSX.Element => {
    const props: AnimationProps = { loop, duration, onAnimationFinish };

    switch (animation) {
        case "check_animation":
            return CheckmarkAnimation(props);
        case "red_x_animation":
            return RedXAnimation(props);
        case "question_mark_animation":
        default:
            return QuestionMarkAnimation(props);
    }
};
